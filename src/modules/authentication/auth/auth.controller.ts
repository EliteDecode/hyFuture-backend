import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthOAuthService } from './services/auth-oauth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { AuthGuard } from '@nestjs/passport';

import type { Request, Response } from 'express';
import { COOKIE_CLEAR_CONFIG, COOKIE_CONFIG } from 'src/config/cookie.config';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import {
  ForgotPasswordDto,
  LoginUserDto,
  RegisterUserDto,
  ResendAuthCodeDto,
  ResetPasswordDto,
  VerifyAuthCodeDto,
} from './dto/create-user.dto';
import { AuthProvider } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: AuthOAuthService,
  ) {}

  @Throttle({
    default: { limit: AUTH_CONSTANTS.MAX_REGISTRATION_ATTEMPTS, ttl: 60000 },
  })
  @Post('register')
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({
    default: { limit: AUTH_CONSTANTS.MAX_VERIFICATION_ATTEMPTS, ttl: 60000 },
  })
  @Post('verify-auth-code')
  async verifyAuthCode(
    @Body() verifyAuthCodeDto: VerifyAuthCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.verifyAuthCode(
      verifyAuthCodeDto.userId,
      verifyAuthCodeDto.code,
    );

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_CONFIG);

    return { accessToken: tokens.accessToken };
  }

  @Throttle({
    default: { limit: AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS, ttl: 60000 },
  })
  @Post('login')
  async login(
    @Body() loginDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(loginDto);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_CONFIG);

    return { accessToken: tokens.accessToken };
  }

  @Throttle({
    default: { limit: 10, ttl: 60000 }, // 10 requests per minute
  })
  @Post('renew-tokens')
  async renewTokens(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies.refreshToken;
    const tokens = await this.authService.renewTokens(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_CONFIG);
    return { accessToken: tokens.accessToken };
  }

  @Throttle({
    default: { limit: 10, ttl: 60000 },
  })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', COOKIE_CLEAR_CONFIG);

    return { message: 'Logged out successfully' };
  }

  @Throttle({
    default: { limit: 5, ttl: 60000 },
  })
  @Post('resend-verification-code')
  async resendVerificationCode(@Body() body: ResendAuthCodeDto) {
    return this.authService.resendVerificationCode(body.email);
  }

  @Throttle({
    default: { limit: 3, ttl: 60000 }, // 3 requests per minute
  })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({
    default: { limit: 3, ttl: 60000 },
  })
  @Post('resend-password-code')
  async resendPasswordCode(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({
    default: { limit: 5, ttl: 60000 }, // 5 requests per minute
  })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.password,
      resetPasswordDto.confirmPassword,
      resetPasswordDto.code,
    );
  }

  // ==================== GOOGLE OAUTH ====================

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirects to Google OAuth
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;

    // Automatically register if new user, or sign in if existing
    const result = await this.oauthService.signInOrRegister({
      provider: AuthProvider.GOOGLE,
      providerId: user.providerId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    });

    res.cookie('refreshToken', result.refreshToken, COOKIE_CONFIG);
    return { accessToken: result.accessToken, user: result.user };
  }

  // ==================== FACEBOOK OAUTH ====================

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Redirects to Facebook OAuth
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;

    // Automatically register if new user, or sign in if existing
    const result = await this.oauthService.signInOrRegister({
      provider: AuthProvider.FACEBOOK,
      providerId: user.providerId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    });

    res.cookie('refreshToken', result.refreshToken, COOKIE_CONFIG);
    return { accessToken: result.accessToken, user: result.user };
  }
}
