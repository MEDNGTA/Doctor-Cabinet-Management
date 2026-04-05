import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { comparePasswords } from './utils';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          throw new Error('Missing password');
        }

        if (!credentials.email && !credentials.username) {
          throw new Error('Missing email or username');
        }

        let user;
        const emailStr = credentials.email ? String(credentials.email) : '';
        const usernameStr = credentials.username ? String(credentials.username) : '';
        
        if (emailStr) {
          const result = await db.query.users.findFirst({
            where: eq(users.email, emailStr),
          });
          user = result;
        } else if (usernameStr) {
          const result = await db.query.users.findFirst({
            where: eq(users.username, usernameStr),
          });
          user = result;
        }

        if (!user) {
          throw new Error('User not found');
        }

        if (!user.isActive) {
          throw new Error('User account is inactive');
        }

        const passwordMatch = await comparePasswords(String(credentials.password), user.passwordHash);
        if (!passwordMatch) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
