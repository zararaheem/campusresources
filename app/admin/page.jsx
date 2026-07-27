import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentEditor, ADMIN_COOKIE } from '@/lib/auth-helpers';
import { signOut } from '@/auth';
import AdminApp from './AdminApp';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const editor = await getCurrentEditor();
  if (!editor) redirect('/admin/signin');

  async function doSignOut() {
    'use server';
    // Clear the access-code cookie (if any)…
    try { (await cookies()).delete(ADMIN_COOKIE); } catch {}
    // …and the Google session, then land on the handbook.
    try {
      await signOut({ redirectTo: '/' });
    } catch {
      redirect('/');
    }
  }

  return <AdminApp editorEmail={editor.email} dev={!!editor.dev} signOutAction={doSignOut} />;
}
