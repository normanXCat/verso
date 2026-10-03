export const VERSO_VERSION = '0.1.0';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}
