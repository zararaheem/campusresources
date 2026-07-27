import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getStore } from '@/lib/store';
import { seedEditorEmails } from '@/lib/seed';

// ── Optional access-code login (bridge while Google OAuth is set up) ─────────
// DISABLED by default — only active when ADMIN_ACCESS_CODE is set in the
// environment. With Google configured, leave it unset so /admin is Google-only.
// The cookie is an HMAC so it can't be forged without the server secret.
export const ADMIN_COOKIE = 'admin_access';
function accessSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'campus-handbook-access';
}
export function accessToken() {
  return crypto.createHmac('sha256', accessSecret()).update('admin-access-v1').digest('hex');
}
export function codeLoginEnabled() {
  return !!(process.env.ADMIN_ACCESS_CODE && process.env.ADMIN_ACCESS_CODE.trim());
}
export function expectedAccessCode() {
  return (process.env.ADMIN_ACCESS_CODE || '').trim();
}

// Resolve the current editor (with role + scoped locations), or null.
// AUTH_DEV_BYPASS=true short-circuits Google sign-in for local development
// and acts as a superadmin.
export async function getCurrentEditor() {
  if (process.env.AUTH_DEV_BYPASS === 'true') {
    const email = seedEditorEmails()[0] || 'dev@localhost';
    return { email, role: 'super', locations: [], dev: true };
  }
  // Access-code cookie → superadmin, only if code login is enabled.
  if (codeLoginEnabled()) {
    try {
      const jar = await cookies();
      if (jar.get(ADMIN_COOKIE)?.value === accessToken()) {
        const email = seedEditorEmails()[0] || 'code-admin@alpha.school';
        return { email, role: 'super', locations: [], code: true };
      }
    } catch {
      // cookies() unavailable in this context — ignore.
    }
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
