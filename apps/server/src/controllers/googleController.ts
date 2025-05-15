import { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../prismaClient';
import jwt from 'jsonwebtoken';
import { info } from '../../utils/logger';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: profile.emails![0].value },
        });

        if (!user) {
          // Generate a random password for Google-authenticated users
          const randomPassword = crypto.randomBytes(32).toString('hex');
          
          // Create new user if doesn't exist
          user = await prisma.user.create({
            data: {
              email: profile.emails![0].value,
              password: randomPassword, // Store random password
              isVerified: true, // Google emails are pre-verified
              googleId: profile.id,
            },
          });
          info(`Created new user via Google OAuth: ${user.email}`);
        } else if (!user.googleId) {
          // Link existing user with Google if not already linked
          user = await prisma.user.update({
            where: { email: profile.emails![0].value },
            data: { googleId: profile.id },
          });
          info(`Linked existing user with Google: ${user.email}`);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Initiate Google OAuth
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

// Google OAuth callback
export const googleCallback = passport.authenticate('google', {
  failureRedirect: '/login',
  session: false,
});

// Handle successful Google OAuth
export const handleGoogleSuccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user) {
      res.status(401).json({ message: 'Authentication failed' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
