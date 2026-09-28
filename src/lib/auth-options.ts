import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import TwitterProvider from 'next-auth/providers/twitter';
import InstagramProvider from 'next-auth/providers/instagram';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByEmail, createUser, verifyUserPassword, UserProfile } from './db-users';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'qrject-super-secret-nextauth-key-2026',
  providers: [
    // 1. Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-google-client-secret',
      allowDangerousEmailAccountLinking: true,
    }),

    // 2. X (Twitter) OAuth Provider
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || 'demo-twitter-client-id',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || 'demo-twitter-client-secret',
      version: '2.0',
    }),

    // 3. Instagram OAuth Provider
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID || 'demo-instagram-client-id',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || 'demo-instagram-client-secret',
    }),

    // 4. Credentials Provider (Email & Password)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'athlete@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const user = await verifyUserPassword(credentials.email, credentials.password);
        if (!user) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user._id || user.email,
          name: user.name,
          email: user.email,
          image: user.image,
          dob: user.dob,
          occupation: user.occupation,
          plan: user.plan,
          generationsLimit: user.generationsLimit,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return true;

      try {
        const existing = await findUserByEmail(user.email);
        if (!existing) {
          // Auto-create user profile in MongoDB upon OAuth sign-in
          await createUser({
            name: user.name || 'Athlete User',
            email: user.email,
            dob: '',
            occupation: '',
            provider: (account?.provider as any) || 'google',
            providerAccountId: account?.providerAccountId,
            image: user.image || undefined,
          });
        }
      } catch (err) {
        console.warn('Error in NextAuth signIn callback:', err);
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // If user just logged in
      if (user) {
        token.id = user.id;
        token.dob = (user as any).dob || '';
        token.occupation = (user as any).occupation || '';
        token.plan = (user as any).plan || 'free';
        token.generationsLimit = (user as any).generationsLimit || 10;
      }

      // Handle client session.update()
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.dob !== undefined) token.dob = session.dob;
        if (session.occupation !== undefined) token.occupation = session.occupation;
        if (session.plan) token.plan = session.plan;
      }

      // Load fresh profile details from MongoDB / memory
      if (token.email) {
        const profile = await findUserByEmail(token.email);
        if (profile) {
          token.name = profile.name;
          token.dob = profile.dob || '';
          token.occupation = profile.occupation || '';
          token.plan = profile.plan || 'free';
          token.generationsLimit = profile.generationsLimit || 10;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).dob = (token.dob as string) || '';
        (session.user as any).occupation = (token.occupation as string) || '';
        (session.user as any).plan = (token.plan as string) || 'free';
        (session.user as any).generationsLimit = (token.generationsLimit as number) || 10;
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
    error: '/',
  },
};
