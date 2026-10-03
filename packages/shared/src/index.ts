export const VERSO_VERSION = '0.1.0';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export * from './schemas/auth.js';
export * from './schemas/search.js';
export * from './schemas/song.js';
export * from './schemas/tag.js';
