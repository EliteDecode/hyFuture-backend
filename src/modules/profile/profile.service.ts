import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DatabaseService } from 'src/shared/database/database.service';
import { UsersService } from 'src/modules/authentication/users/users.service';
import { compareData } from 'src/common/utils/hash.util';
import { hashData } from 'src/common/utils/hash.util';
import { sanitizeEmail, isStringEmpty } from 'src/common/utils/sanitize.util';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';

@Injectable()
export class ProfileService {
  private readonly logger = new MyLoggerService(ProfileService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return user details without password
    const { password, ...userDetails } = user;
    return userDetails;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    // Update name if provided
    if (updateProfileDto.name !== undefined) {
      updateData.name = updateProfileDto.name;
    }

    // Update email if provided
    if (updateProfileDto.email !== undefined) {
      const sanitizedEmail = sanitizeEmail(updateProfileDto.email);
      if (isStringEmpty(sanitizedEmail)) {
        throw new BadRequestException('Invalid email address');
      }

      // Check if email is already taken by another user
      const existingUser =
        await this.usersService.findUserByEmail(sanitizedEmail);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already taken');
      }

      updateData.email = sanitizedEmail;
      // Reset email verification if email is changed
      updateData.isEmailVerified = false;
    }

    // Update user
    const updatedUser = await this.databaseService.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Return user details without password
    const { password, ...userDetails } = updatedUser;

    this.logger.log(`Profile updated for user: ${userId}`);

    return userDetails;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Validate passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    // Check if new password is same as current password
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Get user with password
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has a password (LOCAL provider users only)
    if (!user.password) {
      throw new BadRequestException(
        'This account was created with social login. Password change is not available for social accounts.',
      );
    }

    // Verify current password
    const isPasswordValid = await compareData(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Invalid password attempt for password change: ${userId}`,
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashData(changePasswordDto.newPassword);

    // Update password
    await this.databaseService.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed successfully for user: ${userId}`);

    return { message: 'Password changed successfully' };
  }
}
