/**
 * YouTubeQA — Claude Q&A bar for the YouTube widget.
 *
 * Sends transcript context + user question to Claude for video analysis.
 */

import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { TranscriptSegment } from '../../stores/youtube-player';

interface YouTubeQAProps {
  videoTitle: string;
  transcript: TranscriptSegment[] | null;
}

export default function YouTubeQA({ videoTitle, transcript }: YouTubeQAProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setLoading(true);
    setResponse(null);

    try {
      // Build transcript text for context
      const transcriptText = transcript
        ? transcript.map(s => `[${formatTime(s.start)}] ${s.text}`).join('\n').slice(0, 50000)
        : '(No transcript available)';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `[Video Context]\nTitle: ${videoTitle}\n\nTranscript:\n${transcriptText}\n\n[Question]\n${question}`,
            },
          ],
          system: 'You are a helpful assistant analyzing a YouTube video based on its transcript. Answer the user\'s question concisely. Reference specific timestamps when relevant (format: [M:SS]).',
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setResponse(data.content?.[0]?.text || data.text || 'No response.');
    } catch (err) {
      setResponse(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [input, loading, videoTitle, transcript]);

  return (
    <div>
      {response && (
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border)',
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          maxHeight: 150,
          overflowY: 'auto',
          background: 'var(--bg-card)',
        }}>
          {response}
        </div>
      )}
      <form className="youtube-qa" onSubmit={handleSubmit}>
        <input
          className="youtube-qa-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Claude about this video..."
          disabled={loading}
        />
        <button className="youtube-qa-send" type="submit" disabled={!input.trim() || loading}>
          {loading ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
