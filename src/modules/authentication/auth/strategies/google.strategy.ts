import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthProvider } from '@prisma/client';

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified?: boolean }>;
  name: {
    givenName?: string;
    familyName?: string;
    displayName?: string;
  };
  photos?: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const callbackURL = `${process.env.OAUTH_CALLBACK_BASE_URL}/auth/google/verify`;

    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true, // Allow access to request in validate
    });
  }
  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name, photos } = profile;

    const user = {
      provider: AuthProvider.GOOGLE,
      providerId: id,
      email: emails[0]?.value,
      name:
        name?.displayName ||
        `${name?.givenName || ''} ${name?.familyName || ''}`.trim() ||
        null,
      avatar: photos?.[0]?.value || null,
      isEmailVerified: emails[0]?.verified ?? true,
    };

    done(null, user);
  }
}
