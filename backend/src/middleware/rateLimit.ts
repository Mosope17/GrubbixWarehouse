import type { RequestHandler } from 'express';

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;

function createRateLimiter(maxAttempts: number, message: string): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      next();
      return;
    }

    if (bucket.count >= maxAttempts) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message,
        },
      });
      return;
    }

    bucket.count += 1;
    next();
  };
}

export const loginRateLimiter = createRateLimiter(
  10,
  'Too many sign-in attempts. Please try again later.',
);

export const passwordResetRateLimiter = createRateLimiter(
  5,
  'Too many password reset requests. Please try again later.',
);

export const adminInviteRateLimiter = createRateLimiter(
  5,
  'Too many administrator invitations. Please try again later.',
);
