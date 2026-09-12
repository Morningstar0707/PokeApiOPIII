import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import pokemonRoutes from './routes/pokemon.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import swaggerDocument from './config/swagger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/pokemon', pokemonRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Pokemon API is running',
    endpoints: {
      health: '/health',
      pokemon: '/api/pokemon',
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
