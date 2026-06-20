import { buildApp } from '@/app';
import { env } from '@/config/env';
import { prisma } from '@/config/prisma';

const app = buildApp();
const server = app.listen(env.PORT, () => {
   
  console.log(
    `🐾 Pet-Match & Care API listening on http://localhost:${env.PORT}  [${env.NODE_ENV}]`,
  );
});

const shutdown = async (signal: string) => {
   
  console.log(`\n${signal} received — shutting down…`);
  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
