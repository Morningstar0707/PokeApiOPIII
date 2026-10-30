import app from './app';
import { env } from './config/env';
import prisma from './config/prisma';

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log('Server running on http://localhost:' + env.port);
});

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // eslint-disable-next-line no-console
  console.log('Received ' + signal + '; closing the HTTP server');

  const forceExitTimer = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Graceful shutdown timed out');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async (error) => {
    clearTimeout(forceExitTimer);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // eslint-disable-next-line no-console
      console.error('Failed to disconnect Prisma cleanly:', disconnectError);
      process.exitCode = 1;
    }

    if (error) {
      // eslint-disable-next-line no-console
      console.error('HTTP server shutdown failed:', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
