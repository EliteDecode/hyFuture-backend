import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { UsersService } from 'src/modules/authentication/users/users.service';
import { TokensService } from 'src/modules/authentication/tokens/tokens.service';
import { DatabaseService } from 'src/shared/database/database.service';
import { MyLoggerService } from 'src/shared/my-logger/my-logger.service';
import { AUTH_MESSAGES } from '../constants/auth.constants';

export interface OAuthUserData {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
  isEmailVerified: boolean;
}

@Injectable()
export class AuthOAuthService {
  private readonly logger = new MyLoggerService(AuthOAuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Register a new user via OAuth
   * Creates a new user account if it doesn't exist
   */
  async register(userData: OAuthUserData) {
    this.logger.log(
      `OAuth registration attempt: ${userData.email} via ${userData.provider}`,
    );

    // Check if user already exists with this provider
    const existingProviderUser = await this.usersService.findUserByProvider(
      userData.provider,
      userData.providerId,
    );

    if (existingProviderUser) {
      throw new ConflictException(
        'This account is already registered. Please sign in instead.',
      );
    }

    // Check if email already exists (email must be unique)
    const existingEmailUser = await this.usersService.findUserByEmail(
      userData.email,
    );

    if (existingEmailUser) {
      throw new ConflictException(
        'An account with this email already exists. Please sign in instead.',
      );
    }

    // Create new user
    const user = await this.usersService.createOAuthUser({
      email: userData.email,
      name: userData.name,
      provider: userData.provider,
      providerId: userData.providerId,
      avatar: userData.avatar,
    });

    // Generate tokens
    const tokens = await this.tokensService.generateToken({
      userId: user.id,
      email: user.email,
    });

    this.logger.log(`OAuth user registered: ${user.id} - ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  /**
   * Sign in an existing user via OAuth
   * Only authenticates users who have already registered with this provider
   */
  async login(userData: OAuthUserData) {
    this.logger.log(
      `OAuth login attempt: ${userData.email} via ${userData.provider}`,
    );

    // Find user by provider and providerId
    const user = await this.usersService.findUserByProvider(
      userData.provider,
      userData.providerId,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Account not found. Please register first.',
      );
    }

    // Verify email matches (security check)
    if (user.email !== userData.email) {
      this.logger.warn(
        `Email mismatch for OAuth user: ${user.id} - expected ${user.email}, got ${userData.email}`,
      );
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if email is verified (should be true for OAuth, but double-check)
    if (!user.isEmailVerified) {
      // Auto-verify OAuth users
      await this.usersService.updateUser({
        id: user.id,
        isEmailVerified: true,
      });
    }

    // Generate tokens
    const tokens = await this.tokensService.generateToken({
      userId: user.id,
      email: user.email,
    });

    this.logger.log(`OAuth user logged in: ${user.id} - ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  /**
   * Sign in or automatically register a user via OAuth
   * If user exists, signs them in. If not, creates a new account automatically.
   */
  async signInOrRegister(userData: OAuthUserData) {
    this.logger.log(
      `OAuth sign in/register attempt: ${userData.email} via ${userData.provider}`,
    );

    // First, try to find user by provider and providerId
    let user = await this.usersService.findUserByProvider(
      userData.provider,
      userData.providerId,
    );

    // If user exists with this provider, sign them in
    if (user) {
      // Verify email matches (security check)
      if (user.email !== userData.email) {
        this.logger.warn(
          `Email mismatch for OAuth user: ${user.id} - expected ${user.email}, got ${userData.email}`,
        );
        throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
      }

      // Store user reference to avoid null check issues in transaction
      const currentUser = user;

      // Use transaction to ensure atomicity
      const result = await this.databaseService.$transaction(async (tx) => {
        // Auto-verify OAuth users if not already verified
        if (!currentUser.isEmailVerified) {
          await tx.user.update({
            where: { id: currentUser.id },
            data: { isEmailVerified: true },
          });
          currentUser.isEmailVerified = true;
        }

        // Link guest letters to user account
        // Find all letters sent from this email that don't have a userId yet
        const linkedLetters = await tx.letter.updateMany({
          where: {
            senderEmail: currentUser.email,
            userId: null,
          },
          data: {
            userId: currentUser.id,
            isGuest: false,
          },
        });

        if (linkedLetters.count > 0) {
          this.logger.log(
            `Linked ${linkedLetters.count} guest letter(s) to user account: ${currentUser.id}`,
          );
        }

        // Generate tokens
        const tokens = await this.tokensService.generateToken({
          userId: currentUser.id,
          email: currentUser.email,
        });

        return tokens;
      });

      this.logger.log(
        `OAuth user signed in: ${currentUser.id} - ${currentUser.email}`,
      );

      return {
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          avatar: currentUser.avatar,
          provider: currentUser.provider,
          isEmailVerified: currentUser.isEmailVerified,
        },
        ...result,
      };
    }

    // User doesn't exist with this provider, check if email exists
    const existingEmailUser = await this.usersService.findUserByEmail(
      userData.email,
    );

    if (existingEmailUser) {
      // Email exists but with different provider - conflict
      throw new ConflictException(
        'An account with this email already exists. Please sign in with your original method.',
      );
    }

    // User doesn't exist at all - create new account automatically
    this.logger.log(
      `Auto-registering new OAuth user: ${userData.email} via ${userData.provider}`,
    );

    // Use transaction to ensure atomicity
    const result = await this.databaseService.$transaction(async (tx) => {
      // Create new user directly in transaction
      const newUser = await tx.user.create({
        data: {
          email: userData.email,
          name: userData.name || null,
          provider: userData.provider,
          providerId: userData.providerId,
          avatar: userData.avatar || null,
          password: null, // OAuth users don't have passwords
          isEmailVerified: true, // OAuth emails are auto-verified
        },
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
      const tokens = await this.tokensService.generateToken({
        userId: newUser.id,
        email: newUser.email,
      });

      return { user: newUser, tokens };
    });

    this.logger.log(
      `OAuth user auto-registered: ${result.user.id} - ${result.user.email}`,
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.avatar,
        provider: result.user.provider,
        isEmailVerified: result.user.isEmailVerified,
      },
      ...result.tokens,
    };
  }
}
