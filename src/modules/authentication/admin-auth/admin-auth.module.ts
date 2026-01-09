import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { DatabaseModule } from 'src/shared/database/database.module';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';

@Module({
    imports: [DatabaseModule, JwtModule.register({
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        signOptions: {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION as any,
        },
    }),],
    controllers: [AdminAuthController],
    providers: [AdminAuthService, AdminJwtAuthGuard],
    exports: [AdminAuthService, AdminJwtAuthGuard, JwtModule],
})
export class AdminAuthModule { }
