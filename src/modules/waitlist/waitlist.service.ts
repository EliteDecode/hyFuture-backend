import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/shared/database/database.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { EmailService } from 'src/shared/email/email.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { sanitizeEmail, isStringEmpty } from 'src/common/utils/sanitize.util';

@Injectable()
export class WaitlistService {
  private readonly logger = new MyLoggerService(WaitlistService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  async create(createWaitlistDto: CreateWaitlistDto) {
    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(createWaitlistDto.email);
    if (isStringEmpty(sanitizedEmail)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    // Check if email already exists in waitlist
    const existingWaitlist = await this.databaseService.waitlist.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingWaitlist) {
      this.logger.warn(
        `Waitlist signup attempt with existing email: ${sanitizedEmail}`,
      );
      throw new ConflictException('This email is already on the waitlist');
    }

    // Create waitlist entry
    const waitlistEntry = await this.databaseService.waitlist.create({
      data: {
        email: sanitizedEmail,
        name: createWaitlistDto.name.trim(),
      },
    });

    this.logger.log(
      `Waitlist entry created: ${waitlistEntry.id} - ${waitlistEntry.email}`,
    );

    // Send confirmation email outside of transaction
    try {
      await this.emailService.sendWaitlistConfirmation({
        email: waitlistEntry.email,
        name: waitlistEntry.name,
      });
      this.logger.log(
        `Waitlist confirmation email sent to: ${waitlistEntry.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send waitlist confirmation email to: ${waitlistEntry.email}`,
        error,
      );
      // Don't throw - waitlist entry is created, email can be resent
    }

    return {
      message: 'Successfully added to waitlist',
      data: {
        id: waitlistEntry.id,
        email: waitlistEntry.email,
        name: waitlistEntry.name,
      },
    };
  }
}
