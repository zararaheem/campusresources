import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentEditor, ADMIN_COOKIE } from '@/lib/auth-helpers';
import { signOut } from '@/auth';
import AdminApp from '../AdminApp';

export const dynamic = 'force-dynamic';

// Direct link to the Medication Management portal, gated by the admin
// @alpha.school Google login (same gate as the rest of /admin).
export default async function MedicationsPage() {
  const editor = await getCurrentEditor();
  if (!editor) redirect('/admin/signin');

  async function doSignOut() {
    'use server';
    try { (await cookies()).delete(ADMIN_COOKIE); } catch {}
    try {
      await signOut({ redirectTo: '/' });
    } catch {
      redirect('/');
    }
  }

  return <AdminApp editorEmail={editor.email} dev={!!editor.dev} signOutAction={doSignOut} only="medications" />;
}
