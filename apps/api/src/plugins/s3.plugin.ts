import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

/** Durée de validité d'une URL présignée de téléversement (5 minutes). */
export const UPLOAD_URL_TTL_SECONDS = 300;

/** Durée de validité d'une URL présignée de lecture (1 heure). */
export const DOWNLOAD_URL_TTL_SECONDS = 60 * 60;

/**
 * Client S3 unique partagé par l'API. `forcePathStyle` est requis pour MinIO
 * en développement local et reste compatible avec Cloudflare R2 en production.
 */
const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export interface S3Storage {
  /** URL présignée PUT permettant au client de téléverser directement l'objet. */
  createUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
  /** URL présignée GET permettant la lecture/streaming temporaire de l'objet. */
  createDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  /** Supprime l'objet binaire du bucket (best effort, jamais bloquant). */
  deleteObject(key: string): Promise<void>;
}

export const s3Storage: S3Storage = {
  createUploadUrl(key, contentType, expiresIn = UPLOAD_URL_TTL_SECONDS) {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
  },

  createDownloadUrl(key, expiresIn = DOWNLOAD_URL_TTL_SECONDS) {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
  },

  async deleteObject(key) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: key }));
    } catch (error) {
      // Le stockage peut être indisponible : la suppression en base reste prioritaire.
      console.warn(`Suppression S3 impossible pour la clé ${key}`, error);
    }
  },
};

/**
 * Expose le stockage compatible S3 sur l'instance Fastify (`app.s3`).
 * Les URLs sont signées hors ligne : aucun appel réseau n'est requis pour les générer.
 */
export const s3Plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.decorate('s3', s3Storage);
};

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Storage;
  }
}
