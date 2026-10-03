import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Les tests d'intégration de l'API partagent une base PostgreSQL unique.
    // L'exécution séquentielle des fichiers évite les interférences de données
    // entre jeux de tests (nettoyages `deleteMany` concurrents).
    fileParallelism: false,
  },
});
