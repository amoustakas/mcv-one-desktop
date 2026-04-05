/**
 * Veo Video Generation Client — Wraps Google GenAI video generation API.
 * Extracted from Google AI Studio veo-studio.
 * Supports: text-to-video, frames-to-video, references-to-video, extend-video.
 */
import {
  GoogleGenAI,
  VideoGenerationReferenceType,
} from '@google/genai';
import type {
  Video,
  VideoGenerationReferenceImage,
} from '@google/genai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const VeoModel = {
  VEO_FAST: 'veo-3.1-fast-generate-preview',
  VEO: 'veo-3.1-generate-preview',
} as const;
export type VeoModel = (typeof VeoModel)[keyof typeof VeoModel];

export const VeoAspectRatio = {
  LANDSCAPE: '16:9',
  PORTRAIT: '9:16',
} as const;
export type VeoAspectRatio = (typeof VeoAspectRatio)[keyof typeof VeoAspectRatio];

export const VeoResolution = {
  P720: '720p',
  P1080: '1080p',
  P4K: '4k',
} as const;
export type VeoResolution = (typeof VeoResolution)[keyof typeof VeoResolution];

export const VeoGenerationMode = {
  TEXT_TO_VIDEO: 'text-to-video',
  FRAMES_TO_VIDEO: 'frames-to-video',
  REFERENCES_TO_VIDEO: 'references-to-video',
  EXTEND_VIDEO: 'extend-video',
} as const;
export type VeoGenerationMode = (typeof VeoGenerationMode)[keyof typeof VeoGenerationMode];

export interface VeoImageInput {
  base64: string;
  mimeType: string;
}

export interface VeoReferenceImage {
  base64: string;
  mimeType: string;
  referenceType: 'ASSET' | 'STYLE';
}

export interface GenerateVideoParams {
  prompt: string;
  model?: VeoModel;
  mode?: VeoGenerationMode;
  aspectRatio?: VeoAspectRatio;
  resolution?: VeoResolution;
  startFrame?: VeoImageInput | null;
  endFrame?: VeoImageInput | null;
  referenceImages?: VeoReferenceImage[];
  styleImage?: VeoImageInput | null;
  inputVideoObject?: Video | null;
  isLooping?: boolean;
}

export interface VeoResult {
  objectUrl: string;
  blob: Blob;
  uri: string;
  video: Video;
}

export type VeoStatus = 'idle' | 'submitting' | 'polling' | 'downloading' | 'complete' | 'error';

export interface VeoOperationStatus {
  done: boolean;
  state: VeoStatus;
  videoUrl?: string;
  videoUri?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export async function generateVideo(
  apiKey: string,
  params: GenerateVideoParams,
  onProgress?: (status: VeoStatus) => void,
): Promise<VeoResult> {
  const ai = new GoogleGenAI({ apiKey });
  const mode = params.mode ?? VeoGenerationMode.TEXT_TO_VIDEO;
  const model = params.model ?? VeoModel.VEO_FAST;

  onProgress?.('submitting');

  // Build config
  const config: any = {
    numberOfVideos: 1,
    resolution: params.resolution ?? VeoResolution.P720,
  };
  if (mode !== VeoGenerationMode.EXTEND_VIDEO) {
    config.aspectRatio = params.aspectRatio ?? VeoAspectRatio.LANDSCAPE;
  }

  const payload: any = { model, config };
  if (params.prompt) payload.prompt = params.prompt;

  // Mode-specific payload assembly
  if (mode === VeoGenerationMode.FRAMES_TO_VIDEO) {
    if (params.startFrame) {
      payload.image = { imageBytes: params.startFrame.base64, mimeType: params.startFrame.mimeType };
    }
    const finalEnd = params.isLooping ? params.startFrame : params.endFrame;
    if (finalEnd) {
      payload.config.lastFrame = { imageBytes: finalEnd.base64, mimeType: finalEnd.mimeType };
    }
  } else if (mode === VeoGenerationMode.REFERENCES_TO_VIDEO) {
    const refs: VideoGenerationReferenceImage[] = [];
    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        refs.push({
          image: { imageBytes: img.base64, mimeType: img.mimeType },
          referenceType: img.referenceType === 'STYLE'
            ? VideoGenerationReferenceType.STYLE
            : VideoGenerationReferenceType.ASSET,
        });
      }
    }
    if (params.styleImage) {
      refs.push({
        image: { imageBytes: params.styleImage.base64, mimeType: params.styleImage.mimeType },
        referenceType: VideoGenerationReferenceType.STYLE,
      });
    }
    if (refs.length > 0) payload.config.referenceImages = refs;
  } else if (mode === VeoGenerationMode.EXTEND_VIDEO) {
    if (!params.inputVideoObject) throw new Error('Input video object required for extend mode.');
    payload.video = params.inputVideoObject;
  }

  // Submit
  let operation = await ai.models.generateVideos(payload);
  onProgress?.('polling');

  // Poll
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (!operation?.response) throw new Error('Video generation failed — no response.');
  const videos = operation.response.generatedVideos;
  if (!videos?.length) throw new Error('No videos were generated.');

  const first = videos[0];
  if (!first?.video?.uri) throw new Error('Generated video is missing a URI.');

  onProgress?.('downloading');

  // Fetch blob
  const url = decodeURIComponent(first.video.uri);
  const res = await fetch(`${url}&key=${apiKey}`);
  if (!res.ok) throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  onProgress?.('complete');
  return { objectUrl, blob, uri: url, video: first.video };
}

// Convenience: file → base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
