import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from './audit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            profile: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Account is inactive or suspended');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Record Audit Event for user login
        await logAuditEvent({
          actorId: user.id,
          action: 'USER_LOGIN',
          entityType: 'User',
          entityId: user.id,
          metadata: { email: user.email },
        });

        const roles = user.userRoles.map((ur) => ur.role.name);

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName || user.name || user.email,
          image: user.profile?.avatarUrl || user.image,
          roles,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).roles = (token.roles as string[]) || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-mode-only',
};
