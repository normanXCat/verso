import { describe, it, expect } from 'vitest';
import { buildRequestHeaders } from './http-client.js';

describe('buildRequestHeaders', () => {
  it('n’ajoute pas Content-Type pour une requête GET sans corps', () => {
    const headers = buildRequestHeaders({ method: 'GET' });
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('n’ajoute pas Content-Type pour une requête POST sans corps', () => {
    const headers = buildRequestHeaders({ method: 'POST' });
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('n’ajoute pas Content-Type pour une requête PATCH sans corps', () => {
    const headers = buildRequestHeaders({ method: 'PATCH' });
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('n’ajoute pas Content-Type pour une requête DELETE sans corps', () => {
    const headers = buildRequestHeaders({ method: 'DELETE' });
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('n’ajoute pas Content-Type lorsque le corps est undefined', () => {
    const headers = buildRequestHeaders({ method: 'POST', body: undefined });
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('n’ajoute pas Content-Type lorsque le corps est null', () => {
    const headers = buildRequestHeaders({ method: 'POST', body: null as unknown as BodyInit });
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('n’ajoute pas Content-Type lorsque le corps est une chaîne vide ou d’espaces', () => {
    expect(buildRequestHeaders({ method: 'POST', body: '' })['Content-Type']).toBeUndefined();
    expect(buildRequestHeaders({ method: 'POST', body: '   ' })['Content-Type']).toBeUndefined();
  });

  it('ajoute Content-Type: application/json lorsqu’un corps JSON non vide est fourni', () => {
    const body = JSON.stringify({ email: 'test@verso.fr' });
    const headers = buildRequestHeaders({ method: 'POST', body });
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('préserve les en-têtes personnalisés passés sous forme d’objet', () => {
    const headers = buildRequestHeaders({
      method: 'POST',
      body: JSON.stringify({ ok: true }),
      headers: {
        'X-Custom-Header': 'valeur',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    expect(headers['X-Custom-Header']).toBe('valeur');
    // L'en-tête explicite fourni dans options.headers l'emporte
    expect(headers['Content-Type']).toBe('application/vnd.api+json');
  });

  it('préserve les en-têtes personnalisés passés sous forme de tableau', () => {
    const headers = buildRequestHeaders({
      method: 'GET',
      headers: [['X-Trace-Id', 'trace-123']],
    });

    expect(headers['X-Trace-Id']).toBe('trace-123');
    expect(headers['Content-Type']).toBeUndefined();
  });
});
