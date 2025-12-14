import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
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



  async findUserById(id: string): Promise<User | null> {
    const user = await this.databaseService.user.findUnique({
      where: { id },
    });
    return user;
  }

  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    // Find user with password
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    }

    // Verify password
    const isPasswordValid = await compareData(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `Invalid password attempt for account deletion: ${userId}`,
      );
      throw new UnauthorizedException(USERS_MESSAGES.INVALID_PASSWORD);
    }


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
}
