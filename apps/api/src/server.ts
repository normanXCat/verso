import { buildApp } from './app.js';
import { env } from './config/env.js';

const port = env.PORT;
const host = env.HOST;

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port, host });
    app.log.info(`Serveur Verso API démarré sur http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
