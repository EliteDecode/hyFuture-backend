import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLoggerModule } from './shared/my-logger/my-logger.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './modules/authentication/auth/auth.module';
import { TokensModule } from './modules/authentication/tokens/tokens.module';
import { UsersModule } from './modules/authentication/users/users.module';
import { EmailService } from './shared/email/email.service';
import { UsersController } from './modules/authentication/users/users.controller';
import { JwtModule } from '@nestjs/jwt';
import { LettersModule } from './modules/letters/letters.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';

@Module({
  imports: [
    DatabaseModule,
    MyLoggerModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60 * 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION as any,
      },
    }),
    AuthModule,
    TokensModule,
    UsersModule,
    LettersModule,
    NotificationsModule,
    WaitlistModule,
  ],
  controllers: [AppController, UsersController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    EmailService,
  ],
})
export class AppModule { }
