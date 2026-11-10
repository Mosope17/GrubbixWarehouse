import { useCallback, useEffect, useState, type FormEvent } from 'react';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { usePageMeta } from '../../hooks/usePageMeta';
import {
  deleteAdminAccount,
  fetchAdminAccounts,
  inviteAdmin,
} from '../../services/admin';
import { ApiError } from '../../services/http';
import type { ManagedAdmin } from '../../types';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function AdminAccounts() {
  usePageMeta('Administrator accounts — Grubbix Warehouse');

  const { session } = useAuth();
  const [accounts, setAccounts] = useState<ManagedAdmin[]>([]);
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<ManagedAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminAccounts()
      .then((data) => {
        if (!cancelled) {
          setAccounts(data);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(messageFor(caught, 'Could not load administrator accounts.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const closeDeleteDialog = useCallback(() => setSelected(null), []);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await inviteAdmin(email.trim());
      setNotice(response.message);
      setEmail('');
      setRetryToken((token) => token + 1);
    } catch (caught) {
      setError(messageFor(caught, 'Could not send the invitation. Check your connection and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      await deleteAdminAccount(selected.id);
      setAccounts((current) => current.filter((account) => account.id !== selected.id));
      setNotice(`${selected.email} and their administrator access were permanently deleted.`);
      setSelected(null);
    } catch (caught) {
      setError(messageFor(caught, 'Could not delete the account. Check your connection and try again.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administrator accounts</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Invite staff by email or permanently remove administrator accounts.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Invite an administrator</h2>
        <p className="mt-1 text-sm text-neutral-600">
          The invitee must open the email and set a password before their account becomes active.
          New invitees receive the standard admin role, not owner access.
        </p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleInvite}>
          <label htmlFor="invite-email" className="sr-only">
            Invitee email address
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="staff@example.com"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? 'Sending invite…' : 'Send invitation'}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Current accounts</h2>
        {loading ? (
          <p role="status" className="mt-4 text-sm text-neutral-500">
            Loading administrator accounts…
          </p>
        ) : accounts.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No administrator accounts were found.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <ul className="divide-y divide-neutral-200">
              {accounts.map((account) => {
                const isCurrent = account.id === session?.admin.id;
                return (
                  <li
                    key={account.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {account.email || 'Email unavailable'}
                        {isCurrent && <span className="ml-2 font-normal text-neutral-500">(you)</span>}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {account.role === 'owner' ? 'Owner' : 'Administrator'}
                        {' · '}
                        {account.isActive ? 'Active' : 'Invitation pending'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setSelected(account)}
                      className="self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                      title={isCurrent ? 'You cannot delete your own account here.' : undefined}
                    >
                      Delete account
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {!loading && error && accounts.length === 0 && (
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="mt-3 text-sm font-semibold text-brand hover:text-brand-dark"
          >
            Try loading again
          </button>
        )}
      </section>

      <ConfirmDialog
        open={selected !== null}
        title="Permanently delete administrator?"
        description={
          selected
            ? `This permanently deletes ${selected.email || 'this account'} from Supabase Auth and revokes their administrator access. This cannot be undone. You cannot delete yourself or the last active owner.`
            : undefined
        }
        confirmLabel="Delete permanently"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}
