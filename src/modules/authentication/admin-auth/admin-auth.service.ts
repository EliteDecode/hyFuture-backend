import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/shared/database/database.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { compareData, hashData } from '../../../common/utils/hash.util';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) { }

  async login(dto: AdminLoginDto) {
    const admin = await this.databaseService.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compareData(dto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id, email: admin.email, isAdmin: true };
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        expiresIn: '1d',
      }),
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  async seedAdmin() {
    const email = 'gospyjo@gmail.com';
    const password = '12@Jkmdaj';
    const hashed = await hashData(password);

    const admin = await this.databaseService.admin.upsert({
      where: { email },
      update: {
        password: hashed,
        name: 'Super Admin',
      },
      create: {
        email,
        password: hashed,
        name: 'Super Admin',
      },
    });

    return {
      message: 'Admin seeded successfully',
      email: admin.email,
    };
  }
}
