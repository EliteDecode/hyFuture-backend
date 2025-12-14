import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { DatabaseModule } from 'src/shared/database/database.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [TokensService],
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION as any,
      },
    }),
  ],
  exports: [TokensService],
})
export class TokensModule {}
