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

@Injectable()
export class LettersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: MyLoggerService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  //Create Letter from DTO (Guest or Authenticated User)
  async createLetterFromDto(
    dto: CreateLetterDto | CreateGuestLetterDto,
    userId?: string,
    sendImmediately: boolean = true,
    isDraft: boolean = false,
  ) {
    this.logger.log(
      `Creating letter: recipient=${dto.recipientEmail}, sender=${'senderEmail' in dto ? dto.senderEmail : 'authenticated user'}, deliveryDate=${dto.deliveryDate}, isDraft=${isDraft}`,
    );

    let user: User | null = null;

    if (userId) {
      user = await this.usersService.findUserById(userId);
      if (!user) {
        throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
      }
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
    const letterData: Prisma.LetterCreateInput = {
      subject: dto.subject,
      content: dto.content, // HTML content stored directly without transformation
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      senderEmail: 'senderEmail' in dto ? dto.senderEmail : user?.email || '', // Set from authenticated user context later
      senderName: 'senderName' in dto ? dto.senderName : user?.name || '', // Set from authenticated user context later
      deliveryDate: new Date(dto.deliveryDate),
      isGuest: !userId,
      status: isDraft ? LetterStatus.DRAFT : LetterStatus.SCHEDULED,
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
              fileUrl: attachment.fileUrl,
              type: attachment.type,
            })),
          },
        }),
    };

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

    // Send immediately if requested (for testing purposes - keep as is)
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
              subject: updateDto.subject,
            }),
            ...(updateDto.content !== undefined && {
              content: updateDto.content,
            }),
            ...(updateDto.recipientEmail !== undefined && {
              recipientEmail: updateDto.recipientEmail,
            }),
            ...(updateDto.recipientName !== undefined && {
              recipientName: updateDto.recipientName,
            }),
            ...(updateDto.deliveryDate !== undefined && {
              deliveryDate: new Date(updateDto.deliveryDate),
            }),
            // Create new attachments if provided
            ...(updateDto.attachments !== undefined &&
              updateDto.attachments.length > 0 && {
                attachments: {
                  create: updateDto.attachments.map((attachment) => ({
                    fileUrl: attachment.fileUrl,
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
    });
    if (letter) {
      this.logger.log(`Letter found: ${id}`);
    } else {
      this.logger.warn(`Letter not found: ${id}`);
    }
    return letter;
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
        data: letters,
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
    return letters;
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

    // Transform letters based on delivery date (only for non-draft letters)
    const now = new Date();
    const transformedLetters = letters.map((letter) => {
      // Drafts are always unlocked (user can view their own drafts)
      if (letter.status === LetterStatus.DRAFT) {
        return {
          ...letter,
          locked: false,
        };
      }

      const deliveryDate = new Date(letter.deliveryDate);

      // If delivery date hasn't been reached, return locked version
      if (deliveryDate > now && letter.status === LetterStatus.SCHEDULED) {
        return {
          id: letter.id,
          deliveryDate: letter.deliveryDate,
          status: letter.status,
          locked: true,
          createdAt: letter.createdAt,
          updatedAt: letter.updatedAt,
        };
      }

      // If delivery date has passed or already delivered, return full letter
      return {
        ...letter,
        locked: false,
      };
    });

    return transformedLetters;
  }

  //Get Letters By Recipient Email
  async getLettersByRecipientEmail(recipientEmail: string) {
    this.logger.log(`Fetching letters for recipient: ${recipientEmail}`);
    const letters = await this.databaseService.letter.findMany({
      where: { recipientEmail },
    });
    this.logger.log(
      `Found ${letters.length} letters for recipient: ${recipientEmail}`,
    );
    return letters;
  }

  //Get Letters By Sender Email
  async getLettersBySenderEmail(senderEmail: string) {
    this.logger.log(`Fetching letters from sender: ${senderEmail}`);
    const letters = await this.databaseService.letter.findMany({
      where: { senderEmail },
    });
    this.logger.log(
      `Found ${letters.length} letters from sender: ${senderEmail}`,
    );
    return letters;
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

    // Check if delivery date has been reached
    const now = new Date();
    const deliveryDate = new Date(letter.deliveryDate);

    if (deliveryDate > now) {
      throw new ForbiddenException(LETTERS_MESSAGES.DELIVERY_DATE_NOT_REACHED);
    }

    this.logger.log(`Letter found and accessible: ${id}`);
    return letter;
  }

  // Delete letter with delivery date check
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

    // Check if delivery date has passed
    const now = new Date();
    const deliveryDate = new Date(letter.deliveryDate);

    if (deliveryDate > now) {
      throw new BadRequestException(
        LETTERS_MESSAGES.CANNOT_DELETE_BEFORE_DELIVERY,
      );
    }

    await this.databaseService.letter.delete({ where: { id } });
    this.logger.log(`Letter deleted successfully: ${id}`);
    return { message: LETTERS_MESSAGES.LETTER_DELETED };
  }
}
