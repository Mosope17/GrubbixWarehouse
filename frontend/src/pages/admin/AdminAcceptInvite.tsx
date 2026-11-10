import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta';
import { acceptAdminInvite } from '../../services/admin';
import { ApiError } from '../../services/http';

type InviteTokens = { accessToken: string; refreshToken: string };

export default function AdminAcceptInvite() {
  usePageMeta('Accept administrator invitation — Grubbix Warehouse');

  const [tokens, setTokens] = useState<InviteTokens | null>(null);
  const [checking, setChecking] = useState(true);
  const [invalidLink, setInvalidLink] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const isInvite = params.get('type') === 'invite';
      const hasProviderError = params.has('error') || params.has('error_description');
      const valid = isInvite && !hasProviderError && Boolean(accessToken && refreshToken);

      setTokens(valid && accessToken && refreshToken ? { accessToken, refreshToken } : null);
      setInvalidLink(!valid);
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!tokens) {
      setInvalidLink(true);
      return;
    }

    setSubmitting(true);
    try {
      await acceptAdminInvite(tokens.accessToken, tokens.refreshToken, password);
      setAccepted(true);
      setTokens(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not accept the invitation. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-ink">
      <div className="h-1.5 w-full bg-brand" aria-hidden="true" />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center">
            <img
              src="/images/grubbix-logo.jpeg"
              alt="Grubbix Warehouse"
              width={576}
              height={480}
              className="h-20 w-auto sm:h-24"
            />
          </div>

          <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-semibold tracking-tight">Accept administrator invitation</h1>
            {checking ? (
              <p role="status" className="mt-3 text-sm text-neutral-600">
                Verifying your invitation…
              </p>
            ) : accepted ? (
              <div className="mt-3">
                <p role="status" className="text-sm text-neutral-600">
                  Your account is ready. Sign in with the password you just created.
                </p>
                <Link
                  to="/admin/login"
                  className="mt-5 block w-full rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Go to admin sign in
                </Link>
              </div>
            ) : invalidLink ? (
              <div className="mt-3">
                <p role="alert" className="text-sm text-red-700">
                  This invitation link is invalid or expired. Ask the owner to remove this pending invite and send a new one.
                </p>
                <Link
                  to="/admin/login"
                  className="mt-5 block text-center text-sm font-medium text-brand hover:text-brand-dark"
                >
                  Go to admin sign in
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-neutral-600">
                  Set a password to activate your administrator account.
                </p>
                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={200}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={200}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                  >
                    {submitting ? 'Activating account…' : 'Set password and activate'}
                  </button>
                </form>
              </>
            )}
          </section>

          <p className="mt-6 text-center text-sm">
            <Link to="/" className="text-neutral-600 transition-colors hover:text-brand">
              ← Back to website
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
