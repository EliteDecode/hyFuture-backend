import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, Prisma, User } from '@prisma/client';
import { compareData } from 'src/common/utils/hash.util';
import { DatabaseService } from 'src/shared/database/database.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { USERS_MESSAGES } from './constants/users.constants';

@Injectable()
export class UsersService {
  private readonly logger = new MyLoggerService(UsersService.name);

  constructor(private readonly databaseService: DatabaseService) { }

  async createUser(
    createUserDto: Prisma.UserUncheckedCreateInput,
  ): Promise<Omit<User, 'password' | 'createdAt' | 'updatedAt'>> {
    const user = await this.databaseService.user.create({
      data: createUserDto,
      omit: {
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateUser(data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    if (!data.id || typeof data.id !== 'string') {
      throw new BadRequestException(USERS_MESSAGES.INVALID_INPUT);
    }
    const user = await this.databaseService.user.update({
      where: { id: data.id },
      data: data,
    });
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.databaseService.user.findFirst({
      where: { email },
    });
    return user;
  }

  async findUserByProvider(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    const user = await this.databaseService.user.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
    return user;
  }

  async createOAuthUser(data: {
    email: string;
    name?: string;
    provider: AuthProvider;
    providerId: string;
    avatar?: string;
  }): Promise<User> {
    // Check if email already exists (email must be unique across all providers)
    const existingUser = await this.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists. Please sign in instead.',
      );
    }

    // Check if provider account already exists
    const existingProviderUser = await this.findUserByProvider(
      data.provider,
      data.providerId,
    );
    if (existingProviderUser) {
      throw new ConflictException(
        'This account is already registered. Please sign in instead.',
      );
    }

    const user = await this.databaseService.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        provider: data.provider,
        providerId: data.providerId,
        avatar: data.avatar || null,
        password: null, // OAuth users don't have passwords
        isEmailVerified: true, // OAuth emails are auto-verified
      },
    });

    this.logger.log(
      `OAuth user created: ${user.id} - ${user.email} via ${data.provider}`,
    );

    return user;
  }



  async findUserById(id: string): Promise<User | null> {
    const user = await this.databaseService.user.findUnique({
      where: { id },
    });
    return user;
  }

  async deleteAccount(
    userId: string,
    password?: string,
  ): Promise<{ message: string }> {
    // Find user
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    }

    // Verify password only for LOCAL provider users
    if (user.provider === AuthProvider.LOCAL) {
      if (!password) {
        throw new BadRequestException('Password is required for account deletion');
      }
      if (!user.password) {
        throw new BadRequestException('Invalid account configuration');
      }
      const isPasswordValid = await compareData(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(
          `Invalid password attempt for account deletion: ${userId}`,
        );
        throw new UnauthorizedException(USERS_MESSAGES.INVALID_PASSWORD);
      }
    }
    // OAuth users don't need password verification


    // Delete everything in transaction
    await this.databaseService.$transaction(async (tx) => {
      // 1. Delete user's token
      await tx.token.deleteMany({
        where: { userId: user.id },
      });

      // 2. Delete user's auth codes
      await tx.authCode.deleteMany({
        where: { userId: user.id },
      });

      // 3. Delete user record (last, after all foreign key constraints are resolved)
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    this.logger.log(`Account deleted: ${user.id} - ${user.email}`);

    return { message: USERS_MESSAGES.ACCOUNT_DELETED };
  }

  // Admin: Get all users
  async getAllUsers() {
    this.logger.log('Admin: Fetching all users');
    return this.databaseService.user.findMany({
      orderBy: { createdAt: 'desc' },
      omit: {
        password: true,
      },
    });
  }
}
