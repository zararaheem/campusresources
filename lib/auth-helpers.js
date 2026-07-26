import { getStore } from '@/lib/store';
import { seedEditorEmails } from '@/lib/seed';

// Resolve the current editor (with role + scoped locations), or null.
// AUTH_DEV_BYPASS=true short-circuits Google sign-in for local development
// and acts as a superadmin.
export async function getCurrentEditor() {
  if (process.env.AUTH_DEV_BYPASS === 'true') {
    const email = seedEditorEmails()[0] || 'dev@localhost';
    return { email, role: 'super', locations: [], dev: true };
  }
  const { auth } = await import('@/auth');
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const rec = await getStore().getEditor(email);
  if (!rec) return null;
  return {
    email,
    role: rec.role === 'super' ? 'super' : 'location',
    locations: Array.isArray(rec.locations) ? rec.locations : [],
  };
}

export function isSuper(editor) {
  return editor?.role === 'super';
}

// Can this editor edit overrides / view a specific location's admin?
export function canEditLocation(editor, code) {
  if (!editor) return false;
  if (editor.role === 'super') return true;
  return (editor.locations || []).includes(code);
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
