import { redirect } from 'next/navigation';
import { getCurrentEditor } from '@/lib/auth-helpers';
import { signOut } from '@/auth';
import AdminApp from './AdminApp';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const editor = await getCurrentEditor();
  if (!editor) redirect('/admin/signin');

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return <AdminApp editorEmail={editor.email} dev={!!editor.dev} signOutAction={doSignOut} />;
}
