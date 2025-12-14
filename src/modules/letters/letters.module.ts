import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LettersService } from './letters.service';
import { LettersController } from './letters.controller';
import { DatabaseModule } from 'src/shared/database/database.module';
import { EmailModule } from 'src/shared/email/email.module';
import { MyLoggerModule } from 'src/shared/my-logger/my-logger.module';
import { UsersModule } from '../authentication/users/users.module';

@Module({
  controllers: [LettersController],
  providers: [LettersService],
  exports: [LettersService],
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
  ],
})
export class LettersModule {}
