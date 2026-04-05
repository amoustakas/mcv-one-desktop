import type { UploadedFile, FilePartContent } from '../kits/types';
import { useFileBridge } from '../../stores/file-bridge';

// ---------------------------------------------------------------------------
// MediaIngestionController — upload local files to Google AI File API,
// poll for ACTIVE state, and build content parts for Gemini prompts.
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // 2 minutes max wait

/** Convert a browser File to base64 string */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Generate a unique file ID */
function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class MediaIngestionController {
  /**
   * Upload a file to Google AI File API.
   * Updates the file-bridge store with progress and state transitions.
   */
  async upload(file: File): Promise<UploadedFile> {
    const store = useFileBridge.getState();
    const id = generateFileId();

    const uploaded: UploadedFile = {
      id,
      localName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      geminiFileUri: '',
      state: 'uploading',
      uploadedAt: Date.now(),
    };

    store.addFile(uploaded);

    try {
      // Convert to base64 and upload
      const base64 = await fileToBase64(file);
      store.setUploadProgress(id, 50);

      const res = await fetch('/api/google-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          fileData: base64,
          mimeType: file.type,
          displayName: file.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      store.setUploadProgress(id, 100);

      // If the file is already ACTIVE (images, small files), we're done
      if (data.state === 'ACTIVE') {
        store.updateFileState(id, 'active', data.uri);
        return { ...uploaded, state: 'active', geminiFileUri: data.uri };
      }

      // For videos and large files, poll until ACTIVE
      store.updateFileState(id, 'processing', data.uri);
      const finalUri = await this.pollUntilActive(data.name, id);
      return { ...uploaded, state: 'active', geminiFileUri: finalUri };
    } catch (err) {
      store.updateFileState(id, 'failed');
      throw err;
    }
  }

  /**
   * Poll the File API until the file state is ACTIVE.
   */
  private async pollUntilActive(fileName: string, fileId: string): Promise<string> {
    const store = useFileBridge.getState();

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const res = await fetch(`/api/google-files?action=poll&name=${encodeURIComponent(fileName)}`);
      if (!res.ok) continue;

      const data = await res.json();

      if (data.state === 'ACTIVE') {
        store.updateFileState(fileId, 'active', data.uri);
        return data.uri;
      }

      if (data.state === 'FAILED') {
        store.updateFileState(fileId, 'failed');
        throw new Error(`File processing failed: ${fileName}`);
      }
    }

    store.updateFileState(fileId, 'failed');
    throw new Error(`File processing timed out: ${fileName}`);
  }

  /**
   * Build Gemini content parts from active uploaded files.
   * These are injected into the Gemini prompt content array.
   */
  buildFileParts(): FilePartContent[] {
    const store = useFileBridge.getState();
    return store.getActiveFiles().map((f) => ({
      fileData: { fileUri: f.geminiFileUri, mimeType: f.mimeType },
    }));
  }

  /**
   * Delete a file from Google AI File API.
   */
  async deleteFile(fileId: string): Promise<void> {
    const store = useFileBridge.getState();
    const file = store.uploadedFiles.find((f) => f.id === fileId);
    if (!file) return;

    // Best-effort server deletion
    if (file.geminiFileUri) {
      const name = file.geminiFileUri.split('/').pop();
      if (name) {
        fetch('/api/google-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', name }),
        }).catch(() => {}); // fire-and-forget
      }
    }

    store.removeFile(fileId);
  }
}

/** Singleton instance */
export const mediaIngestion = new MediaIngestionController();
