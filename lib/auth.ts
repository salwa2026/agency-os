import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: Record<string, any> = {
  // JWT strategy: no database sessions, no PrismaAdapter.
  // Sessions live in a signed cookie — works with any DB connection mode.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Runs once on first sign-in: upsert the user into our DB and store
    // their DB id + role in the JWT so every subsequent request is free.
    async jwt({ token, user }: { token: JWT; user?: { email?: string | null; name?: string | null; image?: string | null } }) {
      if (user?.email) {
        try {
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              role: 'ceo',
            },
            update: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            },
          });
          token.id = dbUser.id;
          token.role = dbUser.role;
        } catch (err) {
          console.error('JWT callback DB error:', err);
          token.role = 'ceo';
        }
      }
      return token;
    },
    // Exposes id + role to getServerSession() / useSession() callers.
    async session({ session, token }: { session: { user?: { id?: string; role?: string; name?: string | null; email?: string | null; image?: string | null } }; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? 'ceo';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
