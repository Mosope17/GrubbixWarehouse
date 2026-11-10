import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/admin';
import { ApiError } from '../../services/http';
import { usePageMeta } from '../../hooks/usePageMeta';

export default function AdminForgotPassword() {
  usePageMeta('Reset admin password — Grubbix Warehouse');

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not request a reset email. Check your connection and try again.',
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
            <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
            {submitted ? (
              <p role="status" className="mt-3 text-sm text-neutral-600">
                If an administrator account exists for that email, a password reset link has been
                sent. Check your inbox and spam folder.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-neutral-600">
                  Enter your administrator email and we’ll send a reset link.
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
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={200}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    {submitting ? 'Sending link…' : 'Send reset link'}
                  </button>
                </form>
              </>
            )}
          </section>

          <p className="mt-6 text-center text-sm">
            <Link
              to="/admin/login"
              className="text-neutral-600 transition-colors hover:text-brand"
            >
              ← Back to admin sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
