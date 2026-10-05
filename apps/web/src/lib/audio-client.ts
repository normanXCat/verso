import type {
  AudioMimeType,
  ConfirmInstrumentalInput,
  ConfirmVoiceNoteInput,
  InstrumentalItem,
  UpdateInstrumentalInput,
  UploadUrlResult,
  VoiceNoteItem,
  VoiceNoteMimeType,
  VoiceNoteUploadUrlInput,
} from '@verso/shared';
import { SongsApiError } from './songs-client.js';

const API_BASE_URL = '/api';

export interface UploadUrlInput {
  filename: string;
  mimeType: AudioMimeType;
  sizeBytes: number;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new SongsApiError(
      (data as { message?: string }).message || `Erreur requête (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

/**
 * Téléverse un fichier binaire directement vers l'URL présignée S3 (PUT)
 * en rapportant la progression, sans jamais transiter par l'API.
 */
export function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Échec du téléversement (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Échec réseau pendant le téléversement'));
    xhr.send(file);
  });
}

/** Déduit le type MIME audio supporté à partir d'une extension de fichier. */
export function inferAudioMimeType(file: File): AudioMimeType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.mp3') || file.type === 'audio/mpeg') {
    return 'audio/mpeg';
  }
  if (name.endsWith('.wav') || file.type === 'audio/wav') {
    return 'audio/wav';
  }
  return null;
}

export const audioClient = {
  async list(songId: string): Promise<InstrumentalItem[]> {
    return request<InstrumentalItem[]>(`/songs/${encodeURIComponent(songId)}/instrumentals`);
  },

  async requestUploadUrl(songId: string, input: UploadUrlInput): Promise<UploadUrlResult> {
    return request<UploadUrlResult>(
      `/songs/${encodeURIComponent(songId)}/instrumentals/upload-url`,
      { method: 'POST', body: JSON.stringify(input) },
    );
  },

  async confirm(songId: string, input: ConfirmInstrumentalInput): Promise<InstrumentalItem> {
    return request<InstrumentalItem>(`/songs/${encodeURIComponent(songId)}/instrumentals/confirm`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, patch: UpdateInstrumentalInput): Promise<InstrumentalItem> {
    return request<InstrumentalItem>(`/instrumentals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/instrumentals/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // --- Mémos vocaux freestyle (FR-048) ---

  async listVoiceNotes(songId: string): Promise<VoiceNoteItem[]> {
    return request<VoiceNoteItem[]>(`/songs/${encodeURIComponent(songId)}/voice-notes`);
  },

  async requestVoiceUploadUrl(
    songId: string,
    input: VoiceNoteUploadUrlInput,
  ): Promise<UploadUrlResult> {
    return request<UploadUrlResult>(`/songs/${encodeURIComponent(songId)}/voice-notes/upload-url`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async confirmVoiceNote(songId: string, input: ConfirmVoiceNoteInput): Promise<VoiceNoteItem> {
    return request<VoiceNoteItem>(`/songs/${encodeURIComponent(songId)}/voice-notes/confirm`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async removeVoiceNote(id: string): Promise<void> {
    await request<void>(`/voice-notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

/**
 * Sélectionne le meilleur format d'enregistrement supporté par le navigateur
 * et le type MIME normalisé attendu par l'API de mémos vocaux (FR-048).
 */
export function pickVoiceRecorderFormat(): {
  mimeType: VoiceNoteMimeType;
  recorderMimeType: string;
} | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }

  const candidates: { mimeType: VoiceNoteMimeType; recorderMimeType: string }[] = [
    { mimeType: 'audio/webm', recorderMimeType: 'audio/webm;codecs=opus' },
    { mimeType: 'audio/webm', recorderMimeType: 'audio/webm' },
    { mimeType: 'audio/mp4', recorderMimeType: 'audio/mp4' },
    { mimeType: 'audio/ogg', recorderMimeType: 'audio/ogg;codecs=opus' },
    { mimeType: 'audio/ogg', recorderMimeType: 'audio/ogg' },
  ];

  return (
    candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate.recorderMimeType)) ??
    null
  );
}
