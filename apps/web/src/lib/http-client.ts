/**
 * Client HTTP central et utilitaires de requêtes pour Verso.
 *
 * Règle stricte :
 * - N'ajoute l'en-tête `Content-Type: application/json` que lorsqu'un corps de
 *   données non vide est fourni.
 * - Pour un POST, PATCH, PUT ou DELETE sans données (ou avec corps vide/null),
 *   aucun en-tête `Content-Type` n'est envoyé, évitant ainsi le rejet Fastify
 *   "Body cannot be empty when content-type is set to 'application/json'".
 */

export function buildRequestHeaders(options: RequestInit = {}): Record<string, string> {
  const hasBody =
    options.body !== undefined &&
    options.body !== null &&
    (typeof options.body !== 'string' || options.body.trim() !== '');

  const headers: Record<string, string> = {};

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    if (typeof Headers !== 'undefined' && options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, options.headers);
    }
  }

  return headers;
}
