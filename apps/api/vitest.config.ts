import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Les tests d'intégration partagent une base PostgreSQL unique :
    // exécution séquentielle des fichiers pour éviter les interférences.
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
