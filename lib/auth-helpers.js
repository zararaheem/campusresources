import { getStore } from '@/lib/store';
import { seedEditorEmails } from '@/lib/seed';

// Resolve the current editor, or null if not signed in / not allowlisted.
// AUTH_DEV_BYPASS=true short-circuits Google sign-in for local development.
export async function getCurrentEditor() {
  if (process.env.AUTH_DEV_BYPASS === 'true') {
    const email = seedEditorEmails()[0] || 'dev@localhost';
    return { email, dev: true };
  }
  const { auth } = await import('@/auth');
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  if (!(await getStore().isEditor(email))) return null;
  return { email };
}

// For use inside API route handlers.
export async function requireEditor() {
  const editor = await getCurrentEditor();
  if (!editor) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return editor;
}
