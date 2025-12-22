import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { BroadcastEmailJobData } from './broadcast-email-queue.processor';
import { BroadcastEmailType } from '../dto/create-broadcast-email.dto';

@Injectable()
export class BroadcastEmailQueueService {
  constructor(
    @InjectQueue('broadcast-email')
    private readonly broadcastEmailQueue: Queue<BroadcastEmailJobData>,
    private readonly logger: MyLoggerService,
  ) {}

  async scheduleBroadcastEmail(
    type: BroadcastEmailType,
    subject: string,
    message: string,
    deliveryDate?: Date,
    actionButton?: {
      introText: string;
      buttonText: string;
      url: string;
    },
  ): Promise<string> {
    const now = new Date();
    const delay = deliveryDate ? deliveryDate.getTime() - now.getTime() : 0;

    // If delivery date is in the past or very close (within 1 minute), send immediately
    if (delay <= 60000) {
      this.logger.log(
        `Delivery date is in the past or very close. Scheduling broadcast email for immediate delivery.`,
      );
      const job = await this.broadcastEmailQueue.add(
        'send-broadcast-email',
        { type, subject, message, actionButton, deliveryDate: undefined },
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
      `Scheduling broadcast email for delivery at ${deliveryDate?.toISOString()} (delay: ${delay}ms)`,
    );

    const job = await this.broadcastEmailQueue.add(
      'send-broadcast-email',
      {
        type,
        subject,
        message,
        actionButton,
        deliveryDate: deliveryDate?.toISOString(),
      },
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
      `Broadcast email scheduled successfully. Job ID: ${job.id}`,
    );
    return job.id || '';
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      const job = await this.broadcastEmailQueue.getJob(jobId);
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
        this.broadcastEmailQueue.getWaitingCount(),
        this.broadcastEmailQueue.getActiveCount(),
        this.broadcastEmailQueue.getCompletedCount(),
        this.broadcastEmailQueue.getFailedCount(),
        this.broadcastEmailQueue.getDelayedCount(),
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
