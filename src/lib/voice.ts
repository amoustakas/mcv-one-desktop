let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

export function isRecordingSupported(): boolean {
  return typeof navigator !== 'undefined'
    && !!navigator.mediaDevices
    && typeof MediaRecorder !== 'undefined';
}

export async function startRecording(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
  audioChunks = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.start(100); // collect in 100ms chunks
}

export async function stopRecording(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) return reject(new Error('No active recording'));

    mediaRecorder.onstop = async () => {
      try {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const buffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
        );

        // Send to STT API
        const res = await fetch('/api/voice-stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64 }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'STT failed');
        }

        const data = await res.json();
        resolve(data.transcript || '');
      } catch (err) {
        reject(err);
      } finally {
        // Stop all tracks
        mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
        mediaRecorder = null;
      }
    };

    mediaRecorder.stop();
  });
}

export function cancelRecording(): void {
  if (mediaRecorder) {
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    mediaRecorder.stop();
    mediaRecorder = null;
  }
  audioChunks = [];
}

let currentAudio: HTMLAudioElement | null = null;

export async function speakText(text: string): Promise<void> {
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const res = await fetch('/api/voice-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'TTS failed' }));
    throw new Error(err.error || 'TTS failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  currentAudio = new Audio(url);
  currentAudio.play();

  return new Promise((resolve) => {
    currentAudio!.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      resolve();
    };
  });
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    URL.revokeObjectURL(currentAudio.src);
    currentAudio = null;
  }
}
