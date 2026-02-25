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
    if (dto.isRecurring) {
      return this.createRecurringBroadcast(dto);
    }

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

  async createRecurringBroadcast(dto: CreateBroadcastEmailDto) {
    const frequency = dto.frequency || 'biweekly';
    let cron = dto.cron;

    if (!cron) {
      if (frequency === 'weekly' || frequency === 'biweekly') {
        cron = '0 18 * * 0'; // Every Sunday 6 PM
      } else if (frequency === 'monthly') {
        cron = '0 18 * * 0#1'; // 1st Sunday of the month 6 PM
      } else {
        cron = '0 18 * * 0'; // Default
      }
    }

    const schedule = await this.databaseService.broadcastSchedule.create({
      data: {
        type: dto.type,
        subject: dto.subject,
        message: dto.message,
        cron,
        frequency,
        isRecurring: true,
        actionButton: dto.actionButton as any,
      },
    });

    await this.queueService.scheduleRecurringBroadcast(
      schedule.id,
      dto.type,
      dto.subject,
      dto.message,
      cron,
      dto.actionButton,
    );

    return {
      message: 'Recurring broadcast scheduled successfully (Every 2 weeks on Sunday)',
      data: schedule,
    };
  }

  async getRecurringSchedules() {
    return this.databaseService.broadcastSchedule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRecurringSchedule(id: string, dto: Partial<CreateBroadcastEmailDto>) {
    const existing = await this.databaseService.broadcastSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // If cron changed, remove old job and add new one
    if (dto.cron && dto.cron !== existing.cron) {
      await this.queueService.removeRepeatableJob(id, existing.cron!);
      await this.queueService.scheduleRecurringBroadcast(
        id,
        (dto.type as BroadcastEmailType) || (existing.type as BroadcastEmailType),
        dto.subject || existing.subject,
        dto.message || existing.message,
        dto.cron,
        dto.actionButton || existing.actionButton,
      );
    } else if (dto.subject || dto.message || dto.type || dto.actionButton) {
      // Content changed, update existing job by re-adding it with same cron
      await this.queueService.scheduleRecurringBroadcast(
        id,
        (dto.type as BroadcastEmailType) || (existing.type as BroadcastEmailType),
        dto.subject || existing.subject,
        dto.message || existing.message,
        dto.cron || existing.cron!,
        dto.actionButton || existing.actionButton,
      );
    }

    const updated = await this.databaseService.broadcastSchedule.update({
      where: { id },
      data: {
        type: dto.type,
        subject: dto.subject,
        message: dto.message,
        cron: dto.cron,
        actionButton: dto.actionButton as any,
        isActive: dto.isRecurring !== undefined ? dto.isRecurring : undefined,
      },
    });

    return {
      message: 'Recurring broadcast updated successfully',
      data: updated,
    };
  }

  async deleteRecurringSchedule(id: string) {
    const existing = await this.databaseService.broadcastSchedule.findUnique({
      where: { id },
    });

    if (existing && existing.cron) {
      await this.queueService.removeRepeatableJob(id, existing.cron);
    }

    await this.databaseService.broadcastSchedule.delete({
      where: { id },
    });

    return { message: 'Recurring broadcast deleted successfully' };
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
    } else if (type === BroadcastEmailType.TEST) {
      return 1;
    } else {
      return testEmails.length;
    }
  }
}
