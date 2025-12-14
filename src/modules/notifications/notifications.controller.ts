import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current.user';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getNotifications(@CurrentUser() user: ICurrentUser) {
    return this.notificationsService.getNotificationsByUserId(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: ICurrentUser) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: ICurrentUser) {
    return this.notificationsService.markAllAsRead(user.sub);
  }
}

