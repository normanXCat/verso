export const VERSO_VERSION = '0.1.0';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export * from './lyrics-engine/rhymes.js';
export * from './lyrics-engine/syllables.js';
export * from './schemas/album.js';
export * from './schemas/audio.js';
export * from './schemas/auth.js';
export * from './schemas/search.js';
export * from './schemas/share.js';
export * from './schemas/song.js';
export * from './schemas/tag.js';
export * from './schemas/version.js';
export * from './text-metrics.js';
