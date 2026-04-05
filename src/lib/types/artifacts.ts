// ---------------------------------------------------------------------------
// Artifact Types — generated code, documents, data from AI responses
// ---------------------------------------------------------------------------

export type ArtifactType = 'code' | 'document' | 'data' | 'html' | 'svg' | 'mermaid';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
  messageIndex: number;
  createdAt: number;
}
