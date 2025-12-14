import { Controller, Post, Body } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  create(@Body() createWaitlistDto: CreateWaitlistDto) {
    return this.waitlistService.create(createWaitlistDto);
  }
}
