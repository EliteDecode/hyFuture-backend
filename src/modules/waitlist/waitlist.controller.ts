import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) { }

  @Post()
  create(@Body() createWaitlistDto: CreateWaitlistDto) {
    return this.waitlistService.create(createWaitlistDto);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/all')
  async getAllWaitlist() {
    return this.waitlistService.getAllWaitlist();
  }
}
