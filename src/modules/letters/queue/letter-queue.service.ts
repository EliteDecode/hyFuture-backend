import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { LetterDeliveryJobData } from './letter-queue.processor';

@Injectable()
export class LetterQueueService {
    constructor(
        @InjectQueue('letter-delivery')
        private readonly letterQueue: Queue<LetterDeliveryJobData>,
        private readonly logger: MyLoggerService,
    ) { }


    async scheduleLetterDelivery(
        letterId: string,
        deliveryDate: Date,
    ): Promise<string> {
        // Normalize dates to UTC to ensure consistent timezone handling
        const now = new Date();
        const nowUTC = new Date(now.toISOString());
        const deliveryDateUTC = new Date(deliveryDate.toISOString());
        
        // Calculate delay in milliseconds (both dates are in UTC)
        const delay = deliveryDateUTC.getTime() - nowUTC.getTime();

        // Convert delay to human-readable format for logging
        const delayHours = Math.floor(delay / (1000 * 60 * 60));
        const delayMinutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));

        // If delivery date is in the past or very close (within 1 minute), deliver immediately
        if (delay <= 60000) {
            this.logger.log(
                `Delivery date is in the past or very close for letter ${letterId}. Scheduling for immediate delivery.`,
            );
            this.logger.log(
                `Current time: ${nowUTC.toISOString()}, Delivery time: ${deliveryDateUTC.toISOString()}, Delay: ${delay}ms`,
            );
            const job = await this.letterQueue.add(
                'deliver-letter',
                { letterId },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                },
            );
            return job.id || '';
        }

        // Schedule for future delivery
        this.logger.log(
            `Scheduling letter ${letterId} for delivery at ${deliveryDateUTC.toISOString()} (UTC)`,
        );
        this.logger.log(
            `Current time: ${nowUTC.toISOString()} (UTC), Delay: ${delayHours}h ${delayMinutes}m (${delay}ms)`,
        );

        const job = await this.letterQueue.add(
            'deliver-letter',
            { letterId },
            {
                delay,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            },
        );

        this.logger.log(
            `Letter ${letterId} scheduled successfully. Job ID: ${job.id}, Will deliver at: ${deliveryDateUTC.toISOString()}`,
        );
        return job.id || '';
    }

    async removeScheduledDelivery(jobId: string): Promise<void> {
        try {
            const job = await this.letterQueue.getJob(jobId);
            if (job) {
                await job.remove();
                this.logger.log(`Removed scheduled delivery job: ${jobId}`);
            }
        } catch (error) {
            this.logger.error(`Failed to remove job ${jobId}`, error);
            throw error;
        }
    }

    async getJobStatus(jobId: string): Promise<any> {
        try {
            const job = await this.letterQueue.getJob(jobId);
            if (!job) {
                return null;
            }

            const state = await job.getState();
            return {
                id: job.id,
                state,
                data: job.data,
                timestamp: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                failedReason: job.failedReason,
            };
        } catch (error) {
            this.logger.error(`Failed to get job status for ${jobId}`, error);
            throw error;
        }
    }


    async getQueueStats(): Promise<any> {
        try {
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                this.letterQueue.getWaitingCount(),
                this.letterQueue.getActiveCount(),
                this.letterQueue.getCompletedCount(),
                this.letterQueue.getFailedCount(),
                this.letterQueue.getDelayedCount(),
            ]);

            return {
                waiting,
                active,
                completed,
                failed,
                delayed,
                total: waiting + active + completed + failed + delayed,
            };
        } catch (error) {
            this.logger.error('Failed to get queue stats', error);
            throw error;
        }
    }
}
