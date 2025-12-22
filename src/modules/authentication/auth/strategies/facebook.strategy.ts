import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthProvider } from '@prisma/client';

export interface FacebookProfile {
  id: string;
  emails?: Array<{ value: string }>;
  name?: {
    givenName?: string;
    familyName?: string;
    middleName?: string;
  };
  photos?: Array<{ value: string }>;
  [key: string]: any; // Allow other Profile properties
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    const callbackURL = `${process.env.OAUTH_CALLBACK_BASE_URL}/auth/facebook/verify`;

    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: callbackURL,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: FacebookProfile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, emails, name, photos } = profile;

    const user = {
      provider: AuthProvider.FACEBOOK,
      providerId: id,
      email: emails?.[0]?.value || null,
      name: name
        ? `${name.givenName || ''} ${name.familyName || ''}`.trim() || null
        : null,
      avatar: photos?.[0]?.value || null,
      isEmailVerified: true,
    };

    done(null, user);
  }
}
