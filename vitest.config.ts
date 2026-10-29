import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Les tests d'intégration de l'API partagent une base PostgreSQL unique.
    // L'exécution séquentielle des fichiers évite les interférences de données
    // entre jeux de tests (nettoyages `deleteMany` concurrents).
    fileParallelism: false,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        'postgresql://normanxcat@localhost/verso_test?host=/var/run/postgresql',
      DIRECT_URL:
        process.env.TEST_DATABASE_URL ||
        'postgresql://normanxcat@localhost/verso_test?host=/var/run/postgresql',
      NODE_ENV: 'test',
      RESEND_API_KEY: '',
    },
  },
});
