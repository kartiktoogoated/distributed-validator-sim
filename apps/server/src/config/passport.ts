import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../prismaClient";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL!;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_REDIRECT_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;
        if (!email) return done(null, false);
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              password: "", // Oauth only
              isVerified: true,
              // googleId: profile.id, // Uncomment if you add this field to your model
              // name: name, // Optional, add to schema if needed
              // avatar: avatar, // Optional, add to schema if needed
            },
          });
        }
        // Attach extra info to user object for downstream use
        (user as any).name = name;
        (user as any).avatar = avatar;
        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err: any) {
    done(err as Error, null);
  }
});

export default passport; 