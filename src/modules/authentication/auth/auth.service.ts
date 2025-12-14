import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { compareData } from 'src/common/utils/hash.util';
import { isStringEmpty, sanitizeEmail } from 'src/common/utils/sanitize.util';
import { UsersService } from 'src/modules/authentication/users/users.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { TokensService } from '../tokens/tokens.service';
import { AUTH_MESSAGES } from './constants/auth.constants';
import { LoginUserDto, RegisterUserDto } from './dto/create-user.dto';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthRegistrationService } from './services/auth-registration.service';
import { generateAuthCode } from '../tokens/helpers/token.helpers';
import { EmailService } from 'src/shared/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new MyLoggerService(AuthService.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
    private readonly registrationService: AuthRegistrationService,
    private readonly passwordService: AuthPasswordService,
    private readonly emailService: EmailService,
  ) {}

  // Registration methods - delegated to AuthRegistrationService
  async register(registerDto: RegisterUserDto) {
    return this.registrationService.register(registerDto);
  }

  async resendVerificationCode(email: string) {
    const sanitizedEmail = sanitizeEmail(email);
    if (isStringEmpty(sanitizedEmail)) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const user = await this.usersService.findUserByEmail(sanitizedEmail);

    if (!user) {
      this.logger.warn(
        `Verification resend requested for non-existent email: ${sanitizedEmail}`,
      );
      return { message: AUTH_MESSAGES.VERIFICATION_CODE_SENT };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(AUTH_MESSAGES.USER_ALREADY_VERIFIED);
    }

    const authCode = generateAuthCode();
    await this.tokensService.saveOrUpdateAuthCode(user.id, authCode);

    await this.emailService.sendVerificationCode({
      email: user.email,
      firstName: user.name || 'User',
      verificationCode: authCode,
    });

    return { message: AUTH_MESSAGES.VERIFICATION_CODE_SENT };
  }

  async verifyAuthCode(userId: string, code: string) {
    return this.registrationService.verifyAuthCode(userId, code);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokensService.revokeToken(refreshToken);
    this.logger.log('User logged out successfully');
  }

  async login(
    signInDto: LoginUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(signInDto.email);
    if (isStringEmpty(sanitizedEmail)) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const user = await this.usersService.findUserByEmail(sanitizedEmail);
    if (!user) {
      this.logger.warn(`Failed login attempt with email: ${sanitizedEmail}`);
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await compareData(
      signInDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user: ${user.id}`);
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`Login attempt by unverified user: ${user.id}`);
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_VERIFIED);
    }

    const tokens = await this.tokensService.generateToken({
      userId: user.id,
      email: user.email,
    });

    this.logger.log(`User logged in: ${user.id} - ${user.email}`);

    return tokens;
  }

  async renewTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.tokensService.generateNewTokens(refreshToken);
    this.logger.log('Tokens renewed successfully');
    return tokens;
  }

  // Password methods - delegated to AuthPasswordService
  async forgotPassword(email: string) {
    return this.passwordService.forgotPassword(email);
  }

  async resetPassword(
    email: string,
    password: string,
    confirmPassword: string,
    code: string,
  ) {
    return this.passwordService.resetPassword(
      email,
      password,
      confirmPassword,
      code,
    );
  }
}
