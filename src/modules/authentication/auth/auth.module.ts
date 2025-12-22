import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';

import { AuthRegistrationService } from './services/auth-registration.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthOAuthService } from './services/auth-oauth.service';
import { TokensModule } from '../tokens/tokens.module';
import { DatabaseModule } from 'src/shared/database/database.module';
import { UsersModule } from 'src/modules/authentication/users/users.module';
import { EmailModule } from 'src/shared/email/email.module';
import { AuthController } from './auth.controller';
import { LettersModule } from 'src/modules/letters/letters.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRegistrationService,
    AuthPasswordService,
    AuthOAuthService,
    GoogleStrategy,
    FacebookStrategy,
  ],
  imports: [
    PassportModule,
    TokensModule,
    UsersModule,
    DatabaseModule,
    EmailModule,
    LettersModule,
  ],
})
export class AuthModule {}
