import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/shared/database/database.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { EmailService } from 'src/shared/email/email.service';
import { BroadcastEmailType } from '../dto/create-broadcast-email.dto';
import { testEmails } from 'src/common/utils/email.utils';

export interface BroadcastEmailJobData {
  type: BroadcastEmailType;
  subject: string;
  message: string; // HTML content
  deliveryDate?: string; // ISO string of original delivery date, or undefined if immediate
  actionButton?: {
    introText: string;
    buttonText: string;
    url: string;
  };
}

@Processor('broadcast-email')
@Injectable()
export class BroadcastEmailQueueProcessor extends WorkerHost {
  private readonly BATCH_SIZE = 1; // Process emails one by one to respect rate limit (2 req/sec) and allow concurrency

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: MyLoggerService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<BroadcastEmailJobData>): Promise<void> {
    const { type, subject, message, actionButton, deliveryDate } = job.data;

    // Determine the date to display: use deliveryDate if provided, otherwise use current date
    const displayDate = deliveryDate ? new Date(deliveryDate) : new Date();

    this.logger.log(
      `Processing broadcast email job: ${job.id} for type: ${type}`,
    );

    try {
      // Fetch recipients based on type
      const recipients = await this.fetchRecipients(type);

      if (recipients.length === 0) {
        this.logger.warn(`No recipients found for type: ${type}`);
        return;
      }

      this.logger.log(
        `Found ${recipients.length} recipients for broadcast email. Processing in batches...`,
      );

      // Process emails in batches
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < recipients.length; i += this.BATCH_SIZE) {
        const batch = recipients.slice(i, i + this.BATCH_SIZE);
        const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(recipients.length / this.BATCH_SIZE);

        this.logger.log(
          `Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`,
        );

        // Process batch in parallel
        const batchPromises = batch.map((recipient) =>
          this.sendEmailToRecipient(
            recipient,
            subject,
            message,
            displayDate,
            actionButton,
          ),
        );

        const results = await Promise.allSettled(batchPromises);

        // Count successes and failures
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            failureCount++;
            this.logger.error(
              `Failed to send email to ${batch[index].email}: ${result.reason}`,
            );
          }
        });

        // Small delay between batches to avoid overwhelming the email service
        if (i + this.BATCH_SIZE < recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay to respect rate limit
        }
      }

      this.logger.log(
        `Broadcast email job completed. Success: ${successCount}, Failed: ${failureCount}, Total: ${recipients.length}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process broadcast email job: ${job.id}`,
        error.stack || error,
      );
      throw error;
    }
  }

  private async fetchRecipients(
    type: BroadcastEmailType,
  ): Promise<Array<{ email: string; name: string }>> {
    if (type === BroadcastEmailType.WAITLIST) {
      const waitlistEntries = await this.databaseService.waitlist.findMany({
        select: {
          email: true,
          name: true,
        },
      });

      return waitlistEntries.map((entry) => ({
        email: entry.email,
        name: entry.name,
      }));
    } else if (type === BroadcastEmailType.GENERAL) {
      // GENERAL - fetch all users
      const users = await this.databaseService.user.findMany({
        where: {
          isEmailVerified: true, // Only send to verified users
        },
        select: {
          email: true,
          name: true,
        },
      });

      return users.map((user) => ({
        email: user.email,
        name: user.name || 'User', // Fallback to 'User' if name is null
      }));
    } else if (type === BroadcastEmailType.PERSONAL) {
      return testEmails;
    }

    // Default case - should never happen, but TypeScript requires it
    return [];
  }

  private async sendEmailToRecipient(
    recipient: { email: string; name: string },
    subject: string,
    message: string,
    deliveryDate: Date,
    actionButton?: {
      introText: string;
      buttonText: string;
      url: string;
    },
  ): Promise<void> {
    try {
      await this.emailService.sendBroadcastEmail({
        email: recipient.email,
        name: recipient.name,
        subject,
        message,
        deliveryDate,
        actionButton,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send broadcast email to ${recipient.email}`,
        error,
      );
      throw error; // Re-throw to be caught by Promise.allSettled
    }
  }
}
