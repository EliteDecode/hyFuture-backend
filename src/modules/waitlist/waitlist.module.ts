import { Module } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { DatabaseModule } from 'src/shared/database/database.module';
import { EmailModule } from 'src/shared/email/email.module';

@Module({
  controllers: [WaitlistController],
  providers: [WaitlistService],
  imports: [DatabaseModule, EmailModule],
})
export class WaitlistModule {}
