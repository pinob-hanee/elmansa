import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';

export const setupPassport = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return; // Skip if not configured
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));

          done(null, {
            googleId: profile.id,
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatarUrl: profile.photos?.[0]?.value,
          });
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
};
