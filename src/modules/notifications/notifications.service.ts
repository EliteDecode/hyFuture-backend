import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/shared/database/database.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: MyLoggerService,
  ) {}

  // Get all notifications for a user
  async getNotificationsByUserId(userId: string) {
    this.logger.log(`Fetching notifications for user: ${userId}`);
    const notifications = await this.databaseService.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    this.logger.log(`Found ${notifications.length} notifications for user: ${userId}`);
    return notifications;
  }

  // Get unread notifications count
  async getUnreadCount(userId: string) {
    const count = await this.databaseService.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { unreadCount: count };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    this.logger.log(`Marking notification as read: ${notificationId}`);
    const notification = await this.databaseService.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.databaseService.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.log(`Notification marked as read: ${notificationId}`);
    return updated;
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    this.logger.log(`Marking all notifications as read for user: ${userId}`);
    await this.databaseService.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    this.logger.log(`All notifications marked as read for user: ${userId}`);
    return { message: 'All notifications marked as read' };
  }
}

