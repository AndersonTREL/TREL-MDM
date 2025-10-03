import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from './db'
import { verifyPassword } from './crypto'
import speakeasy from 'speakeasy'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000'), // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isValid = await verifyPassword(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        if (user.status === 'BLOCKED') {
          throw new Error('Account is blocked')
        }

        if (user.status === 'INACTIVE') {
          throw new Error('Account is inactive')
        }

        // Verify 2FA if enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.twoFactorCode) {
            throw new Error('2FA code required')
          }

          const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: credentials.twoFactorCode,
            window: 2,
          })

          if (!verified) {
            throw new Error('Invalid 2FA code')
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locale: user.locale,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.locale = user.locale
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.locale = session.locale
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.locale = token.locale as string
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      })
    },
  },
}

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      locale: string
    }
  }

  interface User {
    role: string
    locale: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    locale: string
  }
}

