export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export async function sendGeminiMessage(
  messages: GeminiMessage[],
  systemPrompt: string,
): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content;
}
