import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

import { AuthRegistrationService } from './services/auth-registration.service';
import { AuthPasswordService } from './services/auth-password.service';
import { TokensModule } from '../tokens/tokens.module';
import { DatabaseModule } from 'src/shared/database/database.module';
import { UsersModule } from 'src/modules/authentication/users/users.module';
import { EmailModule } from 'src/shared/email/email.module';
import { AuthController } from './auth.controller';
import { LettersModule } from 'src/modules/letters/letters.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRegistrationService, AuthPasswordService],
  imports: [
    TokensModule,
    UsersModule,
    DatabaseModule,
    EmailModule,
    LettersModule,
  ],
})
export class AuthModule {}
