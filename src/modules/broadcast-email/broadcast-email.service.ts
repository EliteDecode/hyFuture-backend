import { Injectable } from '@nestjs/common';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { BroadcastEmailQueueService } from './queue/broadcast-email-queue.service';
import {
  CreateBroadcastEmailDto,
  BroadcastEmailType,
} from './dto/create-broadcast-email.dto';
import { DatabaseService } from 'src/shared/database/database.service';
import { testEmails } from 'src/common/utils/email.utils';

@Injectable()
export class BroadcastEmailService {
  private readonly logger = new MyLoggerService(BroadcastEmailService.name);

  constructor(
    private readonly queueService: BroadcastEmailQueueService,
    private readonly databaseService: DatabaseService,
  ) { }

  async createBroadcastEmail(dto: CreateBroadcastEmailDto) {
    this.logger.log(
      `Creating broadcast email: type=${dto.type}, subject=${dto.subject}, deliveryDate=${dto.deliveryDate || 'immediate'}`,
    );

    // Get recipient count for response
    const recipientCount = await this.getRecipientCount(dto.type);

    // Schedule email via queue
    const deliveryDate = dto.deliveryDate
      ? new Date(dto.deliveryDate)
      : undefined;

    const jobId = await this.queueService.scheduleBroadcastEmail(
      dto.type,
      dto.subject,
      dto.message,
      deliveryDate,
      dto.actionButton,
    );

    this.logger.log(
      `Broadcast email scheduled: jobId=${jobId}, recipients=${recipientCount}`,
    );

    return {
      message: 'Broadcast email scheduled successfully',
      data: {
        jobId,
        type: dto.type,
        subject: dto.subject,
        recipientCount,
        deliveryDate: dto.deliveryDate || 'immediate',
      },
    };
  }

  async getJobStatus(jobId: string) {
    return this.queueService.getJobStatus(jobId);
  }

  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  private async getRecipientCount(type: BroadcastEmailType): Promise<number> {
    if (type === BroadcastEmailType.WAITLIST) {
      // Target only waitlist members who haven't signed up yet
      const waitlistEmails = await this.databaseService.waitlist.findMany({
        select: { email: true },
      });
      const userEmails = await this.databaseService.user.findMany({
        where: { isEmailVerified: true },
        select: { email: true },
      });
      const userEmailSet = new Set(userEmails.map((u) => u.email));
      return waitlistEmails.filter((w) => !userEmailSet.has(w.email)).length;
    } else if (type === BroadcastEmailType.GENERAL) {
      // General - unique emails from both waitlist and verified users
      const waitlistEmails = await this.databaseService.waitlist.findMany({
        select: { email: true },
      });
      const userEmails = await this.databaseService.user.findMany({
        where: { isEmailVerified: true },
        select: { email: true },
      });
      const allEmails = new Set([
        ...waitlistEmails.map((w) => w.email),
        ...userEmails.map((u) => u.email),
      ]);
      return allEmails.size;
    } else {
      return testEmails.length;
    }
  }
}
