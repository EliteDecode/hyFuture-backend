import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { LettersService } from './letters.service';
import { LettersController } from './letters.controller';
import { DatabaseModule } from 'src/shared/database/database.module';
import { EmailModule } from 'src/shared/email/email.module';
import { MyLoggerModule } from 'src/shared/my-logger/my-logger.module';
import { UsersModule } from '../authentication/users/users.module';
import { LetterQueueService } from './queue/letter-queue.service';
import { LetterQueueProcessor } from './queue/letter-queue.processor';

@Module({
  controllers: [LettersController],
  providers: [LettersService, LetterQueueService, LetterQueueProcessor],
  exports: [LettersService, LetterQueueService],
  imports: [
    DatabaseModule,
    EmailModule,
    MyLoggerModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION as any,
      },
    }),
    BullModule.registerQueue({
      name: 'letter-delivery',
    }),
  ],
})
export class LettersModule { }