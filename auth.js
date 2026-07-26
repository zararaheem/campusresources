import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getStore } from '@/lib/store';

// Auth.js configuration. Google is the only sign-in method. A successful Google
// login is only allowed if the email is on the editors allowlist (managed in
// the backend). Everyone else is rejected.
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
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
