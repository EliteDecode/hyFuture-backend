import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { DatabaseService } from 'src/shared/database/database.service';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private databaseService: DatabaseService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Admin access token is missing');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_ACCESS_TOKEN_SECRET,
            });

            if (!payload.isAdmin) {
                throw new UnauthorizedException('Not an admin token');
            }

            // Verify admin exists in the standalone Admin table
            const admin = await this.databaseService.admin.findUnique({
                where: { id: payload.sub },
            });

            if (!admin) {
                throw new UnauthorizedException('Admin not found');
            }

            // Attach admin info to request object
            request['admin'] = payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired admin token');
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
