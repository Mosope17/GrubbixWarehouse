import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import { ApiError } from './utils/errors';
import { logger } from './utils/logger';

export const app = express();

// Render terminates TLS in front of the app; trust its proxy headers.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = new Set(env.CORS_ORIGINS);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalised = origin.replace(/\/$/, '');
      if (allowedOrigins.has('*') || allowedOrigins.has(normalised)) {
        return callback(null, true);
      }
      return callback(new ApiError(403, 'CORS_NOT_ALLOWED', 'Origin is not allowed.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/api/health' },
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'grubbix-warehouse-api' });
});

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
