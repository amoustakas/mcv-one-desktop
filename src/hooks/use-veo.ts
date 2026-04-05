/**
 * useVeo — React hook wrapping Veo video generation client.
 * Provides generate, status tracking, and gallery management.
 */
import { useState, useCallback, useRef } from 'react';
import {
  generateVideo as veoGenerate,
  type GenerateVideoParams,
  type VeoResult,
  type VeoStatus,
} from '../lib/google/veo-client';

export interface VeoGalleryItem {
  id: string;
  prompt: string;
  objectUrl: string;
  uri: string;
  createdAt: Date;
  mode: string;
}

export interface UseVeoReturn {
  status: VeoStatus;
  error: string | null;
  currentVideo: VeoResult | null;
  gallery: VeoGalleryItem[];
  generate: (params: GenerateVideoParams) => Promise<VeoResult | null>;
  clearError: () => void;
  removeFromGallery: (id: string) => void;
}

export function useVeo(apiKey: string): UseVeoReturn {
  const [status, setStatus] = useState<VeoStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VeoResult | null>(null);
  const [gallery, setGallery] = useState<VeoGalleryItem[]>([]);
  const idCounter = useRef(0);

  const generate = useCallback(async (params: GenerateVideoParams): Promise<VeoResult | null> => {
    setError(null);
    setStatus('submitting');

    try {
      const result = await veoGenerate(apiKey, params, setStatus);
      setCurrentVideo(result);
      setStatus('complete');

      // Add to gallery
      const item: VeoGalleryItem = {
        id: `veo-${Date.now()}-${idCounter.current++}`,
        prompt: params.prompt,
        objectUrl: result.objectUrl,
        uri: result.uri,
        createdAt: new Date(),
        mode: params.mode || 'text-to-video',
      };
      setGallery(prev => [item, ...prev]);

      return result;
    } catch (e: any) {
      const msg = e?.message || 'Video generation failed.';
      setError(msg);
      setStatus('error');
      return null;
    }
  }, [apiKey]);

  const clearError = useCallback(() => { setError(null); setStatus('idle'); }, []);
  const removeFromGallery = useCallback((id: string) => {
    setGallery(prev => prev.filter(v => v.id !== id));
  }, []);

  return { status, error, currentVideo, gallery, generate, clearError, removeFromGallery };
}
