import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BroadcastEmailController } from './broadcast-email.controller';
import { BroadcastEmailService } from './broadcast-email.service';
import { BroadcastEmailQueueService } from './queue/broadcast-email-queue.service';
import { BroadcastEmailQueueProcessor } from './queue/broadcast-email-queue.processor';
import { DatabaseModule } from 'src/shared/database/database.module';
import { EmailModule } from 'src/shared/email/email.module';
import { MyLoggerModule } from 'src/shared/my-logger/my-logger.module';
import { AdminAuthModule } from '../authentication/admin-auth/admin-auth.module';

@Module({
  controllers: [BroadcastEmailController],
  providers: [
    BroadcastEmailService,
    BroadcastEmailQueueService,
    BroadcastEmailQueueProcessor,
  ],
  imports: [
    DatabaseModule,
    EmailModule,
    MyLoggerModule,
    AdminAuthModule,
    BullModule.registerQueue({
      name: 'broadcast-email',
    }),
  ],
})
export class BroadcastEmailModule { }
