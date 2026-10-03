import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Les tests d'intégration partagent une base PostgreSQL unique :
    // exécution séquentielle des fichiers pour éviter les interférences.
    fileParallelism: false,
  },
});
