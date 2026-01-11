import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/shared/database/database.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { EmailService } from 'src/shared/email/email.service';
import { LetterStatus } from '@prisma/client';
import { decrypt, fullyDecrypt } from 'src/common/utils/encryption.util';

export interface LetterDeliveryJobData {
    letterId: string;
}

@Processor('letter-delivery', {
    limiter: {
        max: 1,
        duration: 1000,
    },
})
@Injectable()
export class LetterQueueProcessor extends WorkerHost {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly logger: MyLoggerService,
        private readonly emailService: EmailService,
    ) {
        super();
    }
    async process(job: Job<LetterDeliveryJobData>): Promise<void> {
        const { letterId } = job.data;

        this.logger.log(
            `Processing letter delivery job: ${job.id} for letter: ${letterId}`,
        );
        try {
            const letter = await this.databaseService.letter.findUnique({
                where: { id: letterId },
                include: {
                    attachments: true,
                },
            });

            if (!letter) {
                this.logger.error(`Letter not found: ${letterId}`);
                throw new Error(`Letter not found: ${letterId}`);
            }

            // Check if letter is still scheduled (not already delivered or cancelled)
            if (letter.status !== LetterStatus.SCHEDULED) {
                this.logger.warn(
                    `Letter ${letterId} is not in SCHEDULED status (current: ${letter.status}). Skipping delivery.`,
                );
                return;
            }

            // Format delivery date for email
            const deliveryDateFormatted = new Date(
                letter.deliveryDate,
            ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            // Send the email
            this.logger.log(`Sending email for letter: ${letterId}`);

            // Decrypt subject, content and attachments for email
            // Using fullyDecrypt to handle any number of encryption layers safely
            const decryptedSubject = fullyDecrypt(letter.subject || '');
            const decryptedContent = fullyDecrypt(letter.content || '');

            const decryptedAttachments = letter.attachments.map((att) => ({
                fileUrl: fullyDecrypt(att.fileUrl),
                type: att.type,
            }));

            await this.emailService.sendLetterDelivery({
                email: letter.recipientEmail,
                senderEmail: letter.senderEmail || '',
                recipientEmail: letter.recipientEmail,
                senderName: letter.senderName || undefined,
                recipientName: letter.recipientName || undefined,
                subject: decryptedSubject || undefined,
                content: decryptedContent,
                deliveryDate: deliveryDateFormatted,
                attachments: decryptedAttachments,
            });

            // Update letter status to delivered
            await this.databaseService.letter.update({
                where: { id: letterId },
                data: {
                    status: LetterStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            });

            this.logger.log(`Letter delivered successfully: ${letterId}`);

            // Create notification for authenticated users
            if (letter.userId) {
                await this.createNotification({
                    userId: letter.userId,
                    type: 'LETTER_DELIVERED',
                    title: 'Letter Delivered',
                    message: `Your letter to ${letter.recipientEmail} has been delivered successfully.`,
                    letterId: letter.id,
                });
            }
        } catch (error) {
            this.logger.error(
                `Failed to deliver letter: ${letterId}`,
                error.stack || error,
            );

            // Update letter status to failed
            await this.databaseService.letter.update({
                where: { id: letterId },
                data: { status: LetterStatus.FAILED },
            });

            // Rethrow error to mark job as failed in BullMQ
            throw error;
        }
    }

    // Helper method to create notifications
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
}
