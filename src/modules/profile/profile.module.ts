import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { DatabaseModule } from 'src/shared/database/database.module';
import { UsersModule } from 'src/modules/authentication/users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  imports: [
    DatabaseModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION as any,
      },
    }),
  ],
})
export class ProfileModule {}
