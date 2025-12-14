import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { hashData } from 'src/common/utils/hash.util';
import { sanitizeEmail, isStringEmpty } from 'src/common/utils/sanitize.util';
import { UsersService } from 'src/modules/authentication/users/users.service';
import { TokensService } from '../../tokens/tokens.service';
import { generateAuthCode } from '../../tokens/helpers/token.helpers';
import { DatabaseService } from 'src/shared/database/database.service';
import { AUTH_MESSAGES } from '../constants/auth.constants';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { EmailService } from 'src/shared/email/email.service';


@Injectable()
export class AuthPasswordService {
  private readonly logger = new MyLoggerService(AuthPasswordService.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
  ) { }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const sanitizedEmail = sanitizeEmail(email);
    if (isStringEmpty(sanitizedEmail)) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const user = await this.usersService.findUserByEmail(sanitizedEmail);
    if (!user) {
      // Don't reveal if user exists or not for security
      this.logger.warn(
        `Password reset requested for non-existent email: ${sanitizedEmail}`,
      );
      // Return success message anyway to prevent email enumeration
      return { message: AUTH_MESSAGES.PASSWORD_RESET_CODE_SENT };
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_VERIFIED);
    }

    // Generate OTP code
    const resetCode = generateAuthCode();

    // Save/update auth code (allows overwriting existing codes)
    await this.tokensService.saveOrUpdateAuthCode(user.id, resetCode);

    // Send password reset email with link containing code
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'https://app.ifeto.com'}/reset-password?code=${resetCode}&email=${encodeURIComponent(sanitizedEmail)}`;
      await this.emailService.sendPasswordReset({
        email: sanitizedEmail,
        firstName: user.name || 'User',
        resetCode: resetCode,
        resetLink: resetLink,
      });
      this.logger.log(`Password reset code sent to: ${sanitizedEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to: ${sanitizedEmail}`,
        error,
      );
      // Don't throw - code is saved, email can be resent
    }

    return { message: AUTH_MESSAGES.PASSWORD_RESET_CODE_SENT };
  }

  async resetPassword(
    email: string,
    password: string,
    confirmPassword: string,
    code: string,
  ): Promise<{ message: string }> {
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedCode = code?.trim() || '';

    if (
      isStringEmpty(sanitizedEmail) ||
      isStringEmpty(sanitizedCode) ||
      isStringEmpty(password) ||
      isStringEmpty(confirmPassword)
    ) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException(AUTH_MESSAGES.PASSWORDS_DO_NOT_MATCH);
    }

    const user = await this.usersService.findUserByEmail(sanitizedEmail);
    if (!user) {
      throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    // Verify the reset code (throws exception if invalid)
    await this.tokensService.verifyAuthCode(user.id, sanitizedCode);

    // Update password and delete auth code in transaction
    await this.databaseService.$transaction(async (tx) => {
      const hashedPassword = await hashData(password);

      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Delete the used auth code
      await tx.authCode.deleteMany({
        where: { userId: user.id },
      });
    });

    this.logger.log(`Password reset successful for user: ${user.id}`);

    return { message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS };
  }
}
