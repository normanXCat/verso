import type { FastifyInstance, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyContextConfig {
    allowEmptyBody?: boolean;
  }
}

/**
 * Remplace le parseur JSON par défaut de Fastify pour accepter proprement un
 * corps vide sur les routes qui le déclarent via `config: { allowEmptyBody: true }`.
 *
 * Toutes les autres routes conservent le comportement standard : un POST avec
 * `Content-Type: application/json` et un corps vide est rejeté en 400
 * (`FST_ERR_CTP_EMPTY_JSON_BODY`).
 *
 * Ce plugin doit être enregistré **avant** la déclaration des routes.
 */
export function registerEmptyBodyParser(app: FastifyInstance): void {
  const defaultJsonParser = app.getDefaultJsonParser('ignore', 'ignore') as (
    req: FastifyRequest,
    body: string | Buffer,
    done: (err: Error | null, result?: unknown) => void,
  ) => void;

  app.removeContentTypeParser('application/json');

  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    const isEmpty =
      body === '' ||
      body == null ||
      (typeof body === 'string' && body.trim() === '') ||
      (Buffer.isBuffer(body) && body.length === 0);

    if (isEmpty && req.routeOptions?.config?.allowEmptyBody === true) {
      return done(null, undefined);
    }

    return defaultJsonParser(req, body as string, done);
  });
}
