import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { hashData } from 'src/common/utils/hash.util';
import { sanitizeEmail, isStringEmpty } from 'src/common/utils/sanitize.util';
import { UsersService } from 'src/modules/authentication/users/users.service';
import { TokensService } from '../../tokens/tokens.service';
import {
  CompleteRegistrationDto,
  RegisterUserDto,
} from '../dto/create-user.dto';
import { generateAuthCode } from '../../tokens/helpers/token.helpers';
import { DatabaseService } from 'src/shared/database/database.service';
import { AUTH_MESSAGES } from '../constants/auth.constants';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { EmailService } from 'src/shared/email/email.service';
import { LettersService } from 'src/modules/letters/letters.service';

@Injectable()
export class AuthRegistrationService {
  private readonly logger = new MyLoggerService(AuthRegistrationService.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly lettersService: LettersService,
  ) {}

  async register(
    registerDto: RegisterUserDto,
  ): Promise<{ newUser: Omit<User, 'password' | 'createdAt' | 'updatedAt'> }> {
    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(registerDto.email);
    if (isStringEmpty(sanitizedEmail)) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const user = await this.usersService.findUserByEmail(sanitizedEmail);
    if (user) {
      this.logger.warn(
        `Registration attempt with existing email: ${sanitizedEmail}`,
      );
      throw new UnauthorizedException(AUTH_MESSAGES.USER_ALREADY_EXISTS);
    }
    const hashedPassword = await hashData(registerDto.password);
    const userData: Prisma.UserUncheckedCreateInput = {
      name: registerDto.name,
      email: sanitizedEmail,
      password: hashedPassword,
    };

    const newUser = await this.usersService.createUser(userData);

    const authCode = generateAuthCode();
    await this.tokensService.saveAuthCode(newUser.id, authCode);

    // Send verification email
    try {
      await this.emailService.sendVerificationCode({
        email: newUser.email,
        firstName: newUser.name || 'User',
        verificationCode: authCode,
      });
      this.logger.log(`Verification email sent to: ${newUser.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to: ${newUser.email}`,
        error,
      );
      // Don't throw - user is created, email can be resent
    }

    this.logger.log(`User registered: ${newUser.id} - ${newUser.email}`);

    return { newUser };
  }

  async verifyAuthCode(
    userId: string,
    code: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Sanitize inputs
    const sanitizedCode = code?.trim() || '';
    if (isStringEmpty(sanitizedCode)) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_AUTH_CODE);
    }

    const isAuthCodeValid = await this.tokensService.verifyAuthCode(
      userId,
      sanitizedCode,
    );
    if (!isAuthCodeValid) {
      this.logger.warn(`Invalid auth code attempt for user: ${userId}`);
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_AUTH_CODE);
    }

    // Use transaction to ensure atomicity
    const tokens = await this.databaseService.$transaction(async (tx) => {
      const newUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!newUser) {
        throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
      }

      // Update user to verified
      (await tx.user.update({
        where: { id: newUser.id },
        data: { isEmailVerified: true },
        omit: {
          password: true,
          createdAt: true,
          updatedAt: true,
        },
      })) as Omit<User, 'password' | 'createdAt' | 'updatedAt'>;

      // Delete auth code
      await tx.authCode.deleteMany({
        where: { userId: newUser.id },
      });

      // Link guest letters to user account
      // Find all letters sent from this email that don't have a userId yet
      const linkedLetters = await tx.letter.updateMany({
        where: {
          senderEmail: newUser.email,
          userId: null,
        },
        data: {
          userId: newUser.id,
          isGuest: false,
        },
      });

      if (linkedLetters.count > 0) {
        this.logger.log(
          `Linked ${linkedLetters.count} guest letter(s) to user account: ${newUser.id}`,
        );
      }

      // Generate tokens
      const generatedTokens = await this.tokensService.generateToken({
        userId: newUser.id,
        email: newUser.email,
      });

      this.logger.log(`User verified: ${newUser.id} - ${newUser.email}`);

      return {
        tokens: generatedTokens,
        userEmail: newUser.email,
        userName: newUser.name,
      };
    });

    // Send verification success email outside of transaction
    try {
      await this.emailService.sendVerificationSuccess({
        email: tokens.userEmail,
        firstName: tokens.userName || 'User',
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification success email to: ${tokens.userEmail}`,
        error,
      );
      // Don't throw - user is verified, email can be resent
    }

    return tokens.tokens;
  }
}
