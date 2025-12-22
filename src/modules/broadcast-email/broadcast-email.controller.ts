import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BroadcastEmailService } from './broadcast-email.service';
import { CreateBroadcastEmailDto } from './dto/create-broadcast-email.dto';

@Controller('broadcast-email')
export class BroadcastEmailController {
  constructor(
    private readonly broadcastEmailService: BroadcastEmailService,
  ) {}

  @Post()
  async createBroadcastEmail(@Body() dto: CreateBroadcastEmailDto) {
    return this.broadcastEmailService.createBroadcastEmail(dto);
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

