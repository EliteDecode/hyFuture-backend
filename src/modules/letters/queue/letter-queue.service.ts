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
        const now = new Date();
        const delay = deliveryDate.getTime() - now.getTime();

        // If delivery date is in the past or very close (within 1 minute), deliver immediately
        if (delay <= 60000) {
            this.logger.log(
                `Delivery date is in the past or very close for letter ${letterId}. Scheduling for immediate delivery.`,
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
            `Scheduling letter ${letterId} for delivery at ${deliveryDate.toISOString()} (delay: ${delay}ms)`,
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
            `Letter ${letterId} scheduled successfully. Job ID: ${job.id}`,
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
