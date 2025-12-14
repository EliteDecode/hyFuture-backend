import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/shared/database/database.module';
import { EmailModule } from 'src/shared/email/email.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  imports: [
    DatabaseModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION as any,
      },
    }),
  ],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
