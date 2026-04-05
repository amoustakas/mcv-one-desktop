import { create } from 'zustand';
import type { UploadedFile } from '../lib/kits/types';

// ---------------------------------------------------------------------------
// File Bridge Store — tracks files uploaded to Google AI File API
// ---------------------------------------------------------------------------

interface FileBridgeState {
  uploadedFiles: UploadedFile[];
  uploadProgress: Record<string, number>; // fileId → 0-100
  isUploading: boolean;

  addFile: (file: UploadedFile) => void;
  updateFileState: (fileId: string, state: UploadedFile['state'], geminiFileUri?: string) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  getActiveFiles: () => UploadedFile[];
}

export const useFileBridge = create<FileBridgeState>()((set, get) => ({
  uploadedFiles: [],
  uploadProgress: {},
  isUploading: false,

  addFile: (file) =>
    set((s) => ({
      uploadedFiles: [...s.uploadedFiles, file],
      isUploading: true,
    })),

  updateFileState: (fileId, state, geminiFileUri) =>
    set((s) => {
      const files = s.uploadedFiles.map((f) =>
        f.id === fileId
          ? { ...f, state, ...(geminiFileUri ? { geminiFileUri } : {}) }
          : f,
      );
      const stillUploading = files.some((f) => f.state === 'uploading' || f.state === 'processing');
      return { uploadedFiles: files, isUploading: stillUploading };
    }),

  setUploadProgress: (fileId, progress) =>
    set((s) => ({
      uploadProgress: { ...s.uploadProgress, [fileId]: progress },
    })),

  removeFile: (fileId) =>
    set((s) => {
      const files = s.uploadedFiles.filter((f) => f.id !== fileId);
      const { [fileId]: _, ...rest } = s.uploadProgress;
      return {
        uploadedFiles: files,
        uploadProgress: rest,
        isUploading: files.some((f) => f.state === 'uploading' || f.state === 'processing'),
      };
    }),

  clearFiles: () =>
    set({ uploadedFiles: [], uploadProgress: {}, isUploading: false }),

  getActiveFiles: () =>
    get().uploadedFiles.filter((f) => f.state === 'active'),
}));
