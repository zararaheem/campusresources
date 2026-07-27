import { signIn, auth } from '@/auth';
import { redirect } from 'next/navigation';
import AccessCodeForm from './AccessCodeForm';
import { codeLoginEnabled } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }) {
  // If dev bypass is on, /admin is already open — send them there.
  if (process.env.AUTH_DEV_BYPASS === 'true') redirect('/admin');

  const session = await auth();
  if (session?.user?.email) redirect('/admin');

  const error = (await searchParams)?.error;
  const errorMsg =
    error === 'AccessDenied'
      ? "That account isn't on the editor list. Ask an existing editor to add you."
      : error === 'Configuration'
        ? 'Sign-in isn’t configured yet. An admin needs to set AUTH_SECRET and the Google credentials (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET) in Vercel.'
        : error
          ? 'Something went wrong signing in. Please try again.'
          : null;

  return (
    <div className="shell">
      <div className="center-card signin-wrap">
        <h1>Handbook Editor</h1>
        <p>Sign in with your approved Google account to edit the handbook.</p>
        {errorMsg && (
          <p style={{ color: 'var(--danger)', fontSize: 14 }}>{errorMsg}</p>
        )}
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/admin' });
          }}
        >
          <button className="btn" type="submit">Sign in with Google</button>
        </form>

        {codeLoginEnabled() && <AccessCodeForm />}

        <p className="foot" style={{ marginTop: 24 }}>
          <a href="/">← Back to handbook</a>
        </p>
      </div>
    </div>
  );
}
