import dotenv from 'dotenv';
import { buildApp } from './app.js';

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

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
