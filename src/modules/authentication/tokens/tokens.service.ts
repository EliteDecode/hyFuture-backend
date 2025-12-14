import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/shared/database/database.service';
import { generateAuthCodeExpiresAt } from './helpers/token.helpers';
import { compareData, hashData } from 'src/common/utils/hash.util';
import { TOKENS_MESSAGES } from './constants/tokens.constants';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';

interface TokenPayload {
  sub: string;
  email: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokensService {
  private readonly logger = new MyLoggerService(TokensService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(data: {
    userId: string;
    email: string;
  }): Promise<TokenPair> {
    const tokens = await this.generateTokensOnly(data);
    await this.saveToken(data.userId, tokens.refreshToken);
    return tokens;
  }

  async generateTokensOnly(data: {
    userId: string;
    email: string;
  }): Promise<TokenPair> {
    if (
      !process.env.JWT_ACCESS_TOKEN_SECRET ||
      !process.env.JWT_REFRESH_TOKEN_SECRET
    ) {
      throw new Error('JWT secrets are not configured');
    }

    const payload: Record<string, any> = {
      sub: data.userId,
      email: data.email,
    };

    const accessTokenExpiration =
      process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m';
    const refreshTokenExpiration =
      process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: accessTokenExpiration as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: refreshTokenExpiration as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async saveToken(userId: string, refreshToken: string) {
    const existing = await this.databaseService.token.findFirst({
      where: { userId },
    });

    if (existing) {
      await this.databaseService.token.update({
        where: { id: existing.id },
        data: { refreshToken },
      });
    } else {
      await this.databaseService.token.create({
        data: { userId, refreshToken },
      });
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    if (!process.env.JWT_ACCESS_TOKEN_SECRET) {
      throw new Error('JWT access token secret is not configured');
    }
    return await this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    if (!process.env.JWT_REFRESH_TOKEN_SECRET) {
      throw new Error('JWT refresh token secret is not configured');
    }
    return await this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    });
  }

  async generateNewTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = await this.verifyRefreshToken(refreshToken);
      const user = await this.databaseService.user.findUnique({
        where: { id: decoded.sub },
      });
      if (!user) {
        this.logger.warn(
          `Token refresh attempt for non-existent user: ${decoded.sub}`,
        );
        throw new UnauthorizedException(TOKENS_MESSAGES.USER_NOT_FOUND);
      }
      const tokens = await this.generateToken({
        userId: user.id,
        email: user.email,
      });
      this.logger.log(`Tokens renewed for user: ${user.id}`);
      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn('Invalid token refresh attempt');
      throw new UnauthorizedException(TOKENS_MESSAGES.INVALID_TOKEN);
    }
  }

  async revokeToken(refreshToken: string): Promise<void> {
    const checkedToken = await this.databaseService.token.findFirst({
      where: { refreshToken },
    });
    if (!checkedToken) {
      throw new UnauthorizedException(TOKENS_MESSAGES.TOKEN_NOT_FOUND);
    }
    await this.databaseService.token.delete({
      where: { id: checkedToken.id },
    });
    this.logger.log(`Token revoked for user: ${checkedToken.userId}`);
  }

  async saveAuthCode(userId: string, code: string): Promise<void> {
    const checkExistingAuthCode = await this.databaseService.authCode.findFirst(
      {
        where: { userId },
      },
    );
    if (checkExistingAuthCode && checkExistingAuthCode.expiresAt > new Date()) {
      throw new BadRequestException(TOKENS_MESSAGES.AUTH_CODE_ALREADY_EXISTS);
    }
    if (checkExistingAuthCode && checkExistingAuthCode.expiresAt < new Date()) {
      await this.databaseService.authCode.delete({
        where: { id: checkExistingAuthCode.id },
      });
    }
    const newAuthCode = await hashData(code);
    await this.databaseService.authCode.create({
      data: {
        userId,
        code: newAuthCode,
        expiresAt: generateAuthCodeExpiresAt(),
      },
    });
    this.logger.log(`Auth code saved for user: ${userId}`);
  }

  async verifyAuthCode(userId: string, code: string): Promise<boolean> {
    const checkExistingAuthCode = await this.databaseService.authCode.findFirst(
      {
        where: { userId },
      },
    );
    if (!checkExistingAuthCode) {
      this.logger.warn(
        `Auth code verification failed - not found for user: ${userId}`,
      );
      throw new BadRequestException(TOKENS_MESSAGES.AUTH_CODE_NOT_FOUND);
    }
    if (checkExistingAuthCode.expiresAt < new Date()) {
      this.logger.warn(
        `Auth code verification failed - expired for user: ${userId}`,
      );
      throw new BadRequestException(TOKENS_MESSAGES.AUTH_CODE_EXPIRED);
    }
    const isCodeValid = await compareData(code, checkExistingAuthCode.code);
    if (!isCodeValid) {
      this.logger.warn(
        `Auth code verification failed - invalid code for user: ${userId}`,
      );
      throw new BadRequestException(TOKENS_MESSAGES.AUTH_CODE_INVALID);
    }
    this.logger.log(`Auth code verified successfully for user: ${userId}`);
    return true;
  }

  async deleteAuthCode(userId: string): Promise<void> {
    await this.databaseService.authCode.deleteMany({
      where: { userId },
    });
  }

  async saveOrUpdateAuthCode(userId: string, code: string): Promise<void> {
    // Delete any existing auth code (expired or not) for password reset
    await this.databaseService.authCode.deleteMany({
      where: { userId },
    });

    const newAuthCode = await hashData(code);
    await this.databaseService.authCode.create({
      data: {
        userId,
        code: newAuthCode,
        expiresAt: generateAuthCodeExpiresAt(),
      },
    });
    this.logger.log(`Auth code saved/updated for user: ${userId}`);
  }
}
