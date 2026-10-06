import type { Env } from './config/env.js';

async function main(): Promise<void> {
  // Chargement et validation de l'environnement en premier : en cas de variable
  // manquante, le serveur s'arrête avec un message clair nommant la variable.
  let env: Env;
  try {
    ({ env } = await import('./config/env.js'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n✖ Verso API — démarrage impossible :\n${message}\n`);
    process.exit(1);
  }

  const { buildApp } = await import('./app.js');
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Serveur Verso API démarré sur http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Sonde de la base non bloquante : signale immédiatement une base injoignable
  // plutôt que de laisser chaque requête métier échouer plus tard en 500.
  const { checkDatabaseConnection } = await import('./config/prisma.js');
  try {
    await checkDatabaseConnection();
    app.log.info('Connexion PostgreSQL vérifiée.');
  } catch (error) {
    app.log.warn(
      { err: error },
      'Base PostgreSQL injoignable au démarrage : vérifiez DATABASE_URL et que PostgreSQL est lancé (GET /health).',
    );
  }
}

void main();
