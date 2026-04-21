import cors from 'cors';
import express from 'express';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';
import { logInfo } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logInfo('http.request', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  });

  next();
});

app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/tasks', taskRoutes);

app.get('/', (_req, res) => {
  return res.json({ message: 'API do Desafio Fullstack rodando!' });
});

export { app };
