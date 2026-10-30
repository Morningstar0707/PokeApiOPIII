import cors from 'cors';
import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import pokemonRoutes from './routes/pokemon.routes';
import battleRoutes from './routes/battle.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import swaggerDocument from './config/swagger';
import { env } from './config/env';

const app = express();

app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use('/api/pokemon', pokemonRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.static(path.resolve(process.cwd(), 'dist/client')));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Pokemon API is running',
    endpoints: {
      health: '/health',
      pokemon: '/api/pokemon',
      battles: '/api/battles',
      docs: '/api-docs',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
