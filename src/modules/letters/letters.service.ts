import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, User, LetterStatus } from '@prisma/client';
import { DatabaseService } from 'src/shared/database/database.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { CreateLetterDto, CreateGuestLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { EmailService } from 'src/shared/email/email.service';
import { UsersService } from '../authentication/users/users.service';
import { USERS_MESSAGES } from '../authentication/users/constants/users.constants';
import { LETTERS_MESSAGES } from './constants/letters.constants';

import { LetterQueueService } from './queue/letter-queue.service';
import { encrypt, fullyDecrypt } from 'src/common/utils/encryption.util';

@Injectable()
export class LettersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: MyLoggerService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly letterQueueService: LetterQueueService,
  ) { }

  //Create Letter from DTO (Guest or Authenticated User)
  async createLetterFromDto(
    dto: CreateLetterDto | CreateGuestLetterDto,
    userId?: string,
    sendImmediately: boolean = false,
    isDraft: boolean = false,
  ) {
    this.logger.log(
      `Creating letter: recipient=${dto.recipientEmail}, sender=${'senderEmail' in dto ? dto.senderEmail : 'authenticated user'}, deliveryDate=${dto.deliveryDate}, isDraft=${isDraft}, draftId=${'draftId' in dto ? dto.draftId : 'none'}`,
    );

    let user: User | null = null;

    if (userId) {
      user = await this.usersService.findUserById(userId);
      if (!user) {
        throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
      }
    }

    // Delete draft if draftId is provided (only for authenticated users)
    if (!isDraft && userId && 'draftId' in dto && dto.draftId) {
      await this.deleteDraftIfExists(dto.draftId, userId);
    }

    // Guest letter tracking: Check if guest has already sent any letter (track by guest email only)
    if (!userId && 'senderEmail' in dto) {
      const existingTracking =
        await this.databaseService.guestLetterTracking.findFirst({
          where: {
            guestEmail: dto.senderEmail,
          },
        });

      if (existingTracking) {
        this.logger.warn(
          `Guest ${dto.senderEmail} attempted to send another letter`,
        );
        throw new ConflictException(
          LETTERS_MESSAGES.GUEST_LETTER_LIMIT_REACHED,
        );
      }
    }

    // Transform DTO to Prisma format
    // Note: content is stored as HTML and will be rendered as-is in emails and API responses
    const resolvedSenderEmail =
      ('senderEmail' in dto ? dto.senderEmail : user?.email) || '';
    const resolvedSenderName =
      ('senderName' in dto && dto.senderName !== undefined
        ? dto.senderName
        : user?.name) || '';

    // Use a loose-typed object to allow the new isPublic field before Prisma client is regenerated
    const letterDataAny: any = {
      subject: encrypt(dto.subject || ''), // Encrypt subject
      content: encrypt(dto.content ?? ''), // Encrypt HTML content
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      senderEmail: resolvedSenderEmail, // Set from authenticated user context later
      senderName: resolvedSenderName, // Set from authenticated user context later
      deliveryDate: (() => {
        // Parse and validate delivery date
        const parsedDate = new Date(dto.deliveryDate);
        if (isNaN(parsedDate.getTime())) {
          throw new BadRequestException(
            'Invalid delivery date format. Please use ISO 8601 format (e.g., 2026-12-25T10:00:00Z)',
          );
        }

        // If the date string doesn't contain time (e.g. "2025-12-26"), inherit the current time
        // This ensures "Send at 10am -> Receive at 10am" behavior for date-only selections
        if (!dto.deliveryDate.includes('T')) {
          const now = new Date();
          parsedDate.setUTCHours(
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds()
          );
        }

        // Ensure date is normalized (Date objects are stored as UTC in database)
        return parsedDate;
      })(),
      isGuest: !userId,
      status: isDraft ? LetterStatus.DRAFT : LetterStatus.SCHEDULED,
      isPublic: dto.isPublic ?? false,
      // Connect to user if authenticated
      ...(userId && {
        user: {
          connect: { id: userId },
        },
      }),
      // Create attachments if provided
      ...(dto.attachments &&
        dto.attachments.length > 0 && {
        attachments: {
          create: dto.attachments.map((attachment) => ({
            fileUrl: encrypt(attachment.fileUrl), // Encrypt attachment URL
            type: attachment.type,
          })),
        },
      }),
    };

    const letterData: Prisma.LetterCreateInput = letterDataAny;

    // Use transaction for guest letter tracking
    const letter = await this.databaseService.$transaction(async (tx) => {
      const createdLetter = await tx.letter.create({
        data: letterData,
        include: {
          attachments: true,
        },
      });

      // Create guest letter tracking if it's a guest letter
      if (!userId && 'senderEmail' in dto) {
        await tx.guestLetterTracking.create({
          data: {
            guestEmail: dto.senderEmail,
            recipientEmail: dto.recipientEmail,
            letterId: createdLetter.id,
          },
        });
      }

      return createdLetter;
    });

    this.logger.log(
      `Letter created successfully: ${letter.id} (status: ${letter.status})`,
    );

    // Create notification for scheduled letter (if not draft)
    if (!isDraft && userId) {
      await this.createNotification({
        userId,
        type: 'LETTER_SCHEDULED',
        title: 'Letter Scheduled',
        message: `Your letter to ${dto.recipientEmail} has been scheduled for delivery on ${new Date(dto.deliveryDate).toLocaleDateString()}.`,
        letterId: letter.id,
      });
    }

    // Schedule letter delivery via queue (default behavior)
    if (!isDraft && !sendImmediately) {
      this.logger.log(`Scheduling letter delivery via queue: ${letter.id}`);
      await this.letterQueueService.scheduleLetterDelivery(
        letter.id,
        letter.deliveryDate,
      );
    }
    // Send immediately if requested (for testing purposes or backward compatibility)
    if (sendImmediately && !isDraft) {
      this.logger.log(`Sending email immediately for letter: ${letter.id}`);
      // Format delivery date for email
      const deliveryDateFormatted = new Date(
        dto.deliveryDate,
      ).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      try {
        await this.emailService.sendLetterDelivery({
          email: dto.recipientEmail,
          senderEmail:
            'senderEmail' in dto ? dto.senderEmail : user?.email || '',
          recipientEmail: dto.recipientEmail,
          senderName:
            'senderName' in dto ? dto.senderName : user?.name || undefined,
          recipientName: dto.recipientName,
          subject: dto.subject,
          content: dto.content,
          deliveryDate: deliveryDateFormatted,
          attachments: dto.attachments,
        });

        // Update letter status to delivered and create notification
        await this.databaseService.letter.update({
          where: { id: letter.id },
          data: {
            status: LetterStatus.DELIVERED,
            deliveredAt: new Date(),
          },
        });

        if (userId) {
          await this.createNotification({
            userId,
            type: 'LETTER_DELIVERED',
            title: 'Letter Delivered',
            message: `Your letter to ${dto.recipientEmail} has been delivered successfully.`,
            letterId: letter.id,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to send letter: ${letter.id}`, error);
        await this.databaseService.letter.update({
          where: { id: letter.id },
          data: { status: LetterStatus.FAILED },
        });
      }
    }

    return letter;
  }

  // Create draft letter
  async createDraft(dto: CreateLetterDto, userId: string) {
    return this.createLetterFromDto(dto, userId, false, true);
  }

  // Update draft letter (only drafts can be updated)
  async updateDraft(id: string, userId: string, updateDto: UpdateLetterDto) {
    this.logger.log(`Updating draft letter: ${id}`);

    const letter = await this.databaseService.letter.findUnique({
      where: { id },
    });

    if (!letter) {
      throw new NotFoundException(LETTERS_MESSAGES.LETTER_NOT_FOUND);
    }

    // Check ownership
    if (letter.userId !== userId) {
      throw new ForbiddenException(LETTERS_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    // Only drafts can be updated
    if (letter.status !== LetterStatus.DRAFT) {
      throw new BadRequestException(LETTERS_MESSAGES.CANNOT_UPDATE_SENT_LETTER);
    }

    // Update letter with attachments handling
    const updatedLetter = await this.databaseService.$transaction(
      async (tx) => {
        // Delete existing attachments if new ones are provided
        if (updateDto.attachments !== undefined) {
          await tx.attachment.deleteMany({
            where: { letterId: id },
          });
        }

        // Update letter
        const updated = await tx.letter.update({
          where: { id },
          data: {
            ...(updateDto.subject !== undefined && {
              subject: encrypt(updateDto.subject),
            }),
            ...(updateDto.content !== undefined && {
              content: encrypt(updateDto.content),
            }),
            ...(updateDto.recipientEmail !== undefined && {
              recipientEmail: updateDto.recipientEmail,
            }),
            ...(updateDto.recipientName !== undefined && {
              recipientName: updateDto.recipientName,
            }),
            ...(updateDto.deliveryDate !== undefined && {
              deliveryDate: (() => {
                const d = new Date(updateDto.deliveryDate);
                // If date-only string, inherit current time
                if (!updateDto.deliveryDate.includes('T')) {
                  const now = new Date();
                  d.setUTCHours(
                    now.getUTCHours(),
                    now.getUTCMinutes(),
                    now.getUTCSeconds()
                  );
                }
                return d;
              })(),
            }),
            ...(updateDto.isPublic !== undefined && {
              isPublic: updateDto.isPublic,
            }),
            // Create new attachments if provided
            ...(updateDto.attachments !== undefined &&
              updateDto.attachments.length > 0 && {
              attachments: {
                create: updateDto.attachments.map((attachment) => ({
                  fileUrl: encrypt(attachment.fileUrl),
                  type: attachment.type,
                })),
              },
            }),
          },
          include: {
            attachments: true,
          },
        });

        return updated;
      },
    );

    this.logger.log(`Draft updated successfully: ${id}`);
    return updatedLetter;
  }

  // Create notification helper
  private async createNotification(data: {
    userId: string;
    type: 'LETTER_SCHEDULED' | 'LETTER_DELIVERED' | 'REMINDER' | 'SYSTEM';
    title: string;
    message: string;
    letterId?: string;
  }) {
    try {
      await this.databaseService.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          channel: 'IN_APP',
          title: data.title,
          message: data.message,
          letterId: data.letterId,
        },
      });
      this.logger.log(
        `Notification created for user: ${data.userId}, type: ${data.type}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notification for user: ${data.userId}`,
        error,
      );
      // Don't throw - notifications are not critical
    }
  }

  //Create Letter (Internal use - for Prisma format)
  async createLetter(data: Prisma.LetterCreateInput) {
    this.logger.log(
      `Creating letter: recipient=${data.recipientEmail}, sender=${data.senderEmail}, deliveryDate=${data.deliveryDate}`,
    );
    const letter = await this.databaseService.letter.create({ data });
    this.logger.log(`Letter created successfully: ${letter.id}`);
    return letter;
  }

  //Get Letter By Id
  async getLetterById(id: string) {
    this.logger.log(`Fetching letter by ID: ${id}`);
    const letter = await this.databaseService.letter.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });
    if (letter) {
      this.logger.log(`Letter found: ${id}`);
      return this.transformLetter(letter);
    } else {
      this.logger.warn(`Letter not found: ${id}`);
      return null;
    }
  }

  //Get All Letters
  async getLetters(page?: number, limit?: number, status?: string) {
    this.logger.log(
      `Fetching letters - page: ${page || 'all'}, limit: ${limit || 'none'}, status: ${status || 'any'}`,
    );
    let where: any = {};

    if (status) {
      where.status = status;
    }

    // If page and limit are provided, use pagination
    if (page && limit) {
      const skip = (page - 1) * limit;

      const [letters, total] = await Promise.all([
        this.databaseService.letter.findMany({
          skip,
          where,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            attachments: true,
          },
        }),
        this.databaseService.letter.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Retrieved ${letters.length} letters (page ${page}/${totalPages}, total: ${total})`,
      );

      return {
        data: letters.map((l) => this.transformLetter(l)),
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    // If no pagination params, return all letters
    const letters = await this.databaseService.letter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: true,
      },
    });
    this.logger.log(`Retrieved ${letters.length} letters (no pagination)`);
    return letters.map((l) => this.transformLetter(l));
  }

  //Update Letter
  async updateLetter(id: string, data: Prisma.LetterUpdateInput) {
    this.logger.log(`Updating letter: ${id}`);
    const letter = await this.databaseService.letter.update({
      where: { id },
      data,
    });
    this.logger.log(`Letter updated successfully: ${id}`);
    return letter;
  }

  //Delete Letter
  async deleteLetter(id: string) {
    this.logger.log(`Deleting letter: ${id}`);
    await this.databaseService.letter.delete({ where: { id } });
    this.logger.log(`Letter deleted successfully: ${id}`);
  }

  //Get Letters By User Id
  async getLettersByUserId(userId: string, status?: LetterStatus) {
    this.logger.log(
      `Fetching letters for user: ${userId}, status: ${status || 'all'}`,
    );
    const where: Prisma.LetterWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const letters = await this.databaseService.letter.findMany({
      where,
      include: {
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    this.logger.log(`Found ${letters.length} letters for user: ${userId}`);

    return letters.map((letter) => this.transformLetter(letter));
  }

  //Get Letters By Recipient Email
  async getLettersByRecipientEmail(recipientEmail: string) {
    this.logger.log(`Fetching letters for recipient: ${recipientEmail}`);
    const letters = await this.databaseService.letter.findMany({
      where: { recipientEmail },
      include: {
        attachments: true,
      },
    });
    this.logger.log(
      `Found ${letters.length} letters for recipient: ${recipientEmail}`,
    );
    return letters.map((l) => this.transformLetter(l));
  }

  // Get all public letters (visible to everyone once delivered)
  async getPublicLetters() {
    this.logger.log('Fetching all public letters');
    const where: any = {
      isPublic: true,
      status: LetterStatus.DELIVERED,
    };
    const letters = await this.databaseService.letter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: true,
      },
    });
    this.logger.log(`Retrieved ${letters.length} public letters`);
    return letters.map((l) => this.transformLetter(l));
  }

  // Get single public letter by ID (no auth)
  async getPublicLetterById(id: string) {
    this.logger.log(`Fetching public letter by ID: ${id}`);
    const where: any = {
      id,
      isPublic: true,
      status: LetterStatus.DELIVERED,
    };
    const letter = await this.databaseService.letter.findFirst({
      where,
      include: {
        attachments: true,
      },
    });

    if (!letter) {
      throw new NotFoundException(LETTERS_MESSAGES.LETTER_NOT_FOUND);
    }

    this.logger.log(`Public letter found: ${id}`);
    return this.transformLetter(letter);
  }

  //Get Letters By Sender Email
  async getLettersBySenderEmail(senderEmail: string) {
    this.logger.log(`Fetching letters from sender: ${senderEmail}`);
    const letters = await this.databaseService.letter.findMany({
      where: { senderEmail },
      include: {
        attachments: true,
      },
    });
    this.logger.log(
      `Found ${letters.length} letters from sender: ${senderEmail}`,
    );
    return letters.map((l) => this.transformLetter(l));
  }

  // Get letter by ID with delivery date check
  async getLetterByIdWithDeliveryCheck(id: string, userId: string) {
    this.logger.log(`Fetching letter by ID with delivery check: ${id}`);
    const letter = await this.databaseService.letter.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });

    if (!letter) {
      throw new NotFoundException(LETTERS_MESSAGES.LETTER_NOT_FOUND);
    }

    // Check if user owns this letter
    if (letter.userId !== userId) {
      throw new ForbiddenException(LETTERS_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    this.logger.log(`Letter found and accessible: ${id}`);
    return this.transformLetter(letter);
  }

  // Delete letter - only drafts can be deleted
  async deleteLetterWithDeliveryCheck(id: string, userId: string) {
    this.logger.log(`Attempting to delete letter: ${id}`);
    const letter = await this.databaseService.letter.findUnique({
      where: { id },
    });

    if (!letter) {
      throw new NotFoundException(LETTERS_MESSAGES.LETTER_NOT_FOUND);
    }

    // Check if user owns this letter
    if (letter.userId !== userId) {
      throw new ForbiddenException(LETTERS_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    // Only drafts can be deleted
    if (letter.status !== LetterStatus.DRAFT) {
      throw new BadRequestException(LETTERS_MESSAGES.CANNOT_DELETE_NON_DRAFT);
    }

    await this.databaseService.letter.delete({ where: { id } });
    this.logger.log(`Draft letter deleted successfully: ${id}`);
    return { message: LETTERS_MESSAGES.DRAFT_DELETED };
  }

  // Helper to delete draft if it exists and belongs to user
  private async deleteDraftIfExists(draftId: string, userId: string) {
    try {
      const draft = await this.databaseService.letter.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        this.logger.warn(
          `Draft ${draftId} not found when attempting to delete`,
        );
        return; // Don't throw - draft might have been deleted already
      }

      // Verify ownership and status
      if (draft.userId !== userId) {
        this.logger.warn(
          `User ${userId} attempted to delete draft ${draftId} that doesn't belong to them`,
        );
        throw new ForbiddenException(LETTERS_MESSAGES.UNAUTHORIZED_ACCESS);
      }

      if (draft.status !== LetterStatus.DRAFT) {
        this.logger.warn(
          `Attempted to delete non-draft letter ${draftId} as draft`,
        );
        throw new BadRequestException(
          'The provided ID does not refer to a draft letter',
        );
      }

      // Delete the draft (attachments will be cascade deleted if configured)
      await this.databaseService.letter.delete({
        where: { id: draftId },
      });

      this.logger.log(
        `Draft ${draftId} deleted successfully before creating final letter`,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Log other errors but don't fail letter creation
      this.logger.error(
        `Error deleting draft ${draftId}: ${error.message}`,
        error,
      );
    }
  }

  // Helper to transform letter based on locking logic
  private transformLetter(letter: any, isAdmin: boolean = false) {
    if (!letter) return null;

    // Decrypt subject, content and attachments if available
    // Using fullyDecrypt to handle any number of encryption layers safely
    if (letter.subject) {
      letter.subject = fullyDecrypt(letter.subject);
    }

    if (letter.content) {
      letter.content = fullyDecrypt(letter.content);
    }

    if (letter.attachments) {
      letter.attachments = letter.attachments.map((att: any) => ({
        ...att,
        fileUrl: fullyDecrypt(att.fileUrl),
      }));
    }

    // Admins can see everything
    if (isAdmin) {
      return {
        ...letter,
        locked: false,
      };
    }

    // Drafts are always unlocked
    if (letter.status === LetterStatus.DRAFT) {
      return {
        ...letter,
        locked: false,
      };
    }

    const now = new Date();
    const deliveryDate = new Date(letter.deliveryDate);

    // If delivery date hasn't been reached and it's scheduled, it's locked
    if (deliveryDate > now && letter.status === LetterStatus.SCHEDULED) {
      const { deliveryDate: _, ...rest } = letter;
      return {
        content: 'letter cant be viewed',
        locked: true,
        status: LetterStatus.SCHEDULED,
      };
    }

    // Otherwise, it's unlocked
    return {
      ...letter,
      locked: false,
    };
  }

  // Admin: Get letter statistics
  async getAdminStats() {
    this.logger.log('Admin: Fetching letter statistics');
    const stats = await this.databaseService.letter.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const result = {
      DELIVERED: 0,
      SCHEDULED: 0,
      DRAFT: 0,
      FAILED: 0,
      TOTAL: 0,
    };

    stats.forEach((stat) => {
      result[stat.status] = stat._count._all;
      result.TOTAL += stat._count._all;
    });

    return result;
  }

  // Admin: Get all letters
  async getAdminLetters(status?: LetterStatus) {
    this.logger.log(`Admin: Fetching all letters, status: ${status || 'all'}`);
    const where: Prisma.LetterWhereInput = status ? { status } : {};
    const letters = await this.databaseService.letter.findMany({
      where,
      select: {
        id: true,
        deliveryDate: true,
        deliveredAt: true,
        status: true,
        isGuest: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return letters;
  }


  // Admin: Reschedule a letter (change delivery date, status, and public visibility)
  async adminRescheduleLetter(
    letterId: string,
    newDeliveryDate: string,
    isPublic?: boolean,
  ) {
    this.logger.log(`Admin: Rescheduling letter ${letterId} to ${newDeliveryDate}`);

    // Find the letter
    const letter = await this.databaseService.letter.findUnique({
      where: { id: letterId },
      include: { attachments: true },
    });

    if (!letter) {
      throw new NotFoundException(LETTERS_MESSAGES.LETTER_NOT_FOUND);
    }

    // Parse and validate the new delivery date
    const parsedDate = new Date(newDeliveryDate);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        'Invalid delivery date format. Please use ISO 8601 format (e.g., 2026-12-27T10:00:00Z)',
      );
    }

    // Ensure new delivery date is in the future
    const now = new Date();
    if (parsedDate <= now) {
      throw new BadRequestException(
        'New delivery date must be in the future',
      );
    }

    // Update the letter: reset status to SCHEDULED, clear deliveredAt, set new delivery date
    const updatedLetter = await this.databaseService.letter.update({
      where: { id: letterId },
      data: {
        deliveryDate: parsedDate,
        status: LetterStatus.SCHEDULED,
        deliveredAt: null,
        ...(isPublic !== undefined && { isPublic }),
      },
      include: { attachments: true },
    });

    // Schedule the new delivery
    await this.letterQueueService.scheduleLetterDelivery(
      letterId,
      parsedDate,
    );

    this.logger.log(
      `Admin: Letter ${letterId} rescheduled successfully. New delivery date: ${parsedDate.toISOString()}, isPublic: ${updatedLetter.isPublic}`,
    );

    return this.transformLetter(updatedLetter, true);
  }

  // Admin: Fix multi-layer encryption by fully decrypting and then encrypting once
  async fixDoubleEncryption() {
    this.logger.log('Admin: Starting multi-layer encryption fix migration');
    const letters = await this.databaseService.letter.findMany({
      include: { attachments: true },
    });
    let letterCount = 0;
    let attachmentCount = 0;

    for (const letter of letters) {
      const updatedData: any = {};

      // Handle content
      if (letter.content) {
        const decrypted = fullyDecrypt(letter.content);
        updatedData.content = encrypt(decrypted);
      }

      // Handle subject
      if (letter.subject) {
        const decrypted = fullyDecrypt(letter.subject);
        updatedData.subject = encrypt(decrypted);
      }

      if (Object.keys(updatedData).length > 0) {
        await this.databaseService.letter.update({
          where: { id: letter.id },
          data: updatedData,
        });
        letterCount++;
      }

      // Handle attachments
      for (const att of letter.attachments) {
        if (att.fileUrl) {
          const decrypted = fullyDecrypt(att.fileUrl);
          await this.databaseService.attachment.update({
            where: { id: att.id },
            data: { fileUrl: encrypt(decrypted) },
          });
          attachmentCount++;
        }
      }
    }

    return {
      message: `Successfully processed ${letterCount} letters and ${attachmentCount} attachments`,
    };
  }
}
