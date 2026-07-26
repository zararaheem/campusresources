import { signIn, auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }) {
  // If dev bypass is on, /admin is already open — send them there.
  if (process.env.AUTH_DEV_BYPASS === 'true') redirect('/admin');

  const session = await auth();
  if (session?.user?.email) redirect('/admin');

  const error = (await searchParams)?.error;

  return (
    <div className="shell">
      <div className="center-card signin-wrap">
        <h1>Handbook Editor</h1>
        <p>Sign in with your approved Google account to edit the handbook.</p>
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 14 }}>
            That account isn&apos;t on the editor list. Ask an existing editor to add you.
          </p>
        )}
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/admin' });
          }}
        >
          <button className="btn" type="submit">Sign in with Google</button>
        </form>
        <p className="foot" style={{ marginTop: 24 }}>
          <a href="/">← Back to handbook</a>
        </p>
      </div>
    </div>
  );
}
