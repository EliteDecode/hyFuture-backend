import { Body, Controller, Get, Param, Post, UseGuards, Patch, Delete } from '@nestjs/common';
import { BroadcastEmailService } from './broadcast-email.service';
import { CreateBroadcastEmailDto, BroadcastEmailType } from './dto/create-broadcast-email.dto';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';

@Controller('broadcast-email')
@UseGuards(AdminJwtAuthGuard)
export class BroadcastEmailController {
  constructor(
    private readonly broadcastEmailService: BroadcastEmailService,
  ) { }

  @Post()
  async createBroadcastEmail(@Body() dto: CreateBroadcastEmailDto) {
    return this.broadcastEmailService.createBroadcastEmail(dto);
  }

  @Post('test')
  async createBroadcastTestEmail(@Body() dto: CreateBroadcastEmailDto) {
    dto.type = BroadcastEmailType.TEST;
    return this.broadcastEmailService.createBroadcastEmail(dto);
  }

  @Get('schedules')
  async getRecurringSchedules() {
    return this.broadcastEmailService.getRecurringSchedules();
  }

  @Patch('schedule/:id')
  async updateRecurringSchedule(@Param('id') id: string, @Body() dto: Partial<CreateBroadcastEmailDto>) {
    return this.broadcastEmailService.updateRecurringSchedule(id, dto);
  }

  @Delete('schedule/:id')
  async deleteRecurringSchedule(@Param('id') id: string) {
    return this.broadcastEmailService.deleteRecurringSchedule(id);
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.broadcastEmailService.getJobStatus(jobId);
  }

  @Get('queue/stats')
  async getQueueStats() {
    return this.broadcastEmailService.getQueueStats();
  }
}

