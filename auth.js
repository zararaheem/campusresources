import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getStore } from '@/lib/store';

// Accept either the Auth.js-native env names (AUTH_GOOGLE_ID/SECRET, AUTH_SECRET)
// or the classic Google/NextAuth names, so setup is forgiving.
const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Google({ clientId: googleId, clientSecret: googleSecret }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user?.email?.toLowerCase();
      if (!email) return false;
      try {
        return await getStore().isEditor(email);
      } catch {
        return false;
      }
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/admin/signin',
    error: '/admin/signin',
  },
});
