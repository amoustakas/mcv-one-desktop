import { useState, useRef, useCallback } from 'react';
import { Sparkles, Code, Image, Eye, FileSearch, Zap, Copy, Check, Loader2, Upload } from 'lucide-react';
import Markdown from '../components/Markdown';
import { apiPost } from '../lib/api/client';

/* ───── Types ───── */
type ToolId = 'text' | 'code' | 'image' | 'vision' | 'document' | 'summarize';

interface Tool {
  id: ToolId;
  name: string;
  description: string;
  model: string;
  icon: React.ReactNode;
  color: string;
}

/* ───── Tool Definitions ───── */
const TOOLS: Tool[] = [
  { id: 'text',      name: 'Text Generation',     description: 'General text & reasoning',       model: 'Gemini 2.5 Pro', icon: <Sparkles size={20} />,   color: 'var(--cyan)' },
  { id: 'code',      name: 'Code Generation',      description: 'Code-specific generation',       model: 'Gemini 2.5 Pro', icon: <Code size={20} />,       color: '#3178C6' },
  { id: 'image',     name: 'Image Generation',     description: 'Text-to-image creation',         model: 'Imagen 3',       icon: <Image size={20} />,      color: '#F59E0B' },
  { id: 'vision',    name: 'Vision Analysis',      description: 'Analyze uploaded images',        model: 'Gemini Pro',     icon: <Eye size={20} />,        color: '#10B981' },
  { id: 'document',  name: 'Document Analysis',    description: 'Long-context doc analysis',      model: 'Gemini Pro',     icon: <FileSearch size={20} />, color: 'var(--purple)' },
  { id: 'summarize', name: 'Summarization',        description: 'Fast text summarization',        model: 'Gemini Flash',   icon: <Zap size={20} />,        color: '#EF4444' },
];

const CODE_LANGUAGES = ['typescript', 'python', 'rust', 'go', 'sql', 'javascript', 'java', 'c++', 'bash', 'html', 'css', 'swift', 'kotlin', 'ruby', 'php'];
const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3'];

/* ───── API Helper ───── */
async function callApi(body: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>('/api/google', body);
}

/* ───── Styles ───── */
const S = {
  root: {
    padding: '24px 28px',
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '14px',
    marginBottom: '2px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '0.02em',
  },
  subtitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '12px',
  },
  toolCard: (active: boolean, color: string) => ({
    background: active ? 'var(--bg-elevated)' : 'var(--bg-card)',
    border: `1px solid ${active ? color : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    padding: '16px 14px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...(active ? { boxShadow: `0 0 20px ${color}22, inset 0 1px 0 ${color}18` } : {}),
  }),
  toolCardIcon: (color: string) => ({
    color,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),
  toolCardName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '0.01em',
  },
  toolCardDesc: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  modelBadge: (color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    color,
    background: `${color}12`,
    border: `1px solid ${color}30`,
    borderRadius: 'var(--radius-full)',
    padding: '2px 8px',
    letterSpacing: '0.04em',
    marginTop: '2px',
    width: 'fit-content',
    textTransform: 'uppercase' as const,
  }),
  panel: {
    flex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    minHeight: 0,
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border)',
  },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  panelBody: {
    display: 'flex',
    gap: '16px',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  inputCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    minHeight: 0,
  },
  outputCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minHeight: 0,
    overflow: 'hidden',
  },
  textarea: {
    flex: 1,
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem',
    padding: '12px',
    resize: 'none' as const,
    outline: 'none',
    lineHeight: 1.6,
    minHeight: '120px',
  },
  textareaSmall: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem',
    padding: '10px 12px',
    resize: 'none' as const,
    outline: 'none',
    lineHeight: 1.5,
    minHeight: '38px',
  },
  select: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    padding: '6px 10px',
    outline: 'none',
    cursor: 'pointer',
  },
  btnGenerate: (color: string, disabled: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: disabled ? 'var(--bg-elevated)' : color,
    color: disabled ? 'var(--text-muted)' : '#000',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 20px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.82rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'var(--transition-fast)',
    opacity: disabled ? 0.5 : 1,
  }),
  outputBox: {
    flex: 1,
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
    overflow: 'auto',
    fontSize: '0.82rem',
    color: 'var(--text-primary)',
    lineHeight: 1.7,
    minHeight: '120px',
    position: 'relative' as const,
  },
  outputLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outputLabelText: {
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.68rem',
    fontFamily: 'var(--font-mono)',
    padding: '3px 8px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  label: {
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dropZone: (dragging: boolean) => ({
    flex: 1,
    background: dragging ? 'rgba(0, 240, 255, 0.04)' : 'var(--bg-input)',
    border: `2px dashed ${dragging ? 'var(--cyan)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    padding: '24px',
    minHeight: '120px',
  }),
  dropText: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
  },
  imgPreview: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'contain' as const,
  },
  generatedImg: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: 'var(--radius-md)',
    objectFit: 'contain' as const,
    background: 'var(--bg-deep)',
    border: '1px solid var(--border)',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    textAlign: 'center' as const,
    padding: '40px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'stretch',
  },
} as const;

/* ───── Component ───── */
export default function AIStudioView() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  /* Shared state */
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Code-specific */
  const [language, setLanguage] = useState('typescript');

  /* Image-specific */
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState('');

  /* Vision-specific */
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Document-specific */
  const [docContent, setDocContent] = useState('');
  const [docQuestion, setDocQuestion] = useState('');

  /* Summarize-specific */
  const [sumText, setSumText] = useState('');
  const [sumInstructions, setSumInstructions] = useState('');

  const activeDef = TOOLS.find(t => t.id === activeTool);

  /* Reset state when switching tools */
  function selectTool(id: ToolId) {
    if (id === activeTool) return;
    setActiveTool(id);
    setPrompt('');
    setOutput('');
    setGeneratedImage('');
    setImageBase64('');
    setImageMimeType('');
    setImageFileName('');
    setDocContent('');
    setDocQuestion('');
    setSumText('');
    setSumInstructions('');
    setCopied(false);
  }

  /* File handling for Vision */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFileName(file.name);
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  /* Copy output */
  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* Generate */
  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    setOutput('');
    setGeneratedImage('');
    setCopied(false);

    try {
      let data: Record<string, unknown>;

      switch (activeTool) {
        case 'text':
          if (!prompt.trim()) throw new Error('Please enter a prompt');
          data = await callApi({ action: 'gemini-generate', prompt, systemInstruction: 'You are a helpful AI assistant. Respond with clear, well-structured answers.' });
          setOutput(data.text as string || data.response as string || 'No output generated.');
          break;

        case 'code':
          if (!prompt.trim()) throw new Error('Please enter a prompt');
          data = await callApi({ action: 'code-generate', prompt, language });
          setOutput(data.code as string || data.text as string || data.response as string || 'No output generated.');
          break;

        case 'image':
          if (!prompt.trim()) throw new Error('Please enter a prompt');
          data = await callApi({ action: 'imagen-generate', prompt, aspectRatio });
          setGeneratedImage(data.image as string || data.imageBase64 as string || '');
          if (!data.image && !data.imageBase64) setOutput('Image generation completed but no image data was returned.');
          break;

        case 'vision':
          if (!imageBase64) throw new Error('Please upload an image first');
          data = await callApi({ action: 'gemini-vision', imageBase64, mimeType: imageMimeType, prompt: prompt || 'Describe this image in detail.' });
          setOutput(data.text as string || data.analysis as string || data.response as string || 'No analysis generated.');
          break;

        case 'document':
          if (!docContent.trim()) throw new Error('Please paste document content');
          if (!docQuestion.trim()) throw new Error('Please enter a question');
          data = await callApi({ action: 'gemini-analyze', documents: [{ title: 'Input', content: docContent }], question: docQuestion });
          setOutput(data.answer as string || data.text as string || data.response as string || 'No analysis generated.');
          break;

        case 'summarize':
          if (!sumText.trim()) throw new Error('Please enter text to summarize');
          data = await callApi({ action: 'gemini-summarize', text: sumText, instructions: sumInstructions || undefined });
          setOutput(data.summary as string || data.text as string || data.response as string || 'No summary generated.');
          break;

        default:
          throw new Error('No tool selected');
      }
    } catch (err) {
      setOutput(`**Error:** ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  }

  /* ───── Tool Panel Renderers ───── */
  function renderTextPanel() {
    return (
      <div style={S.panelBody}>
        <div style={S.inputCol}>
          <span style={S.label}>Prompt</span>
          <textarea
            style={S.textarea}
            placeholder="Enter your prompt... Ask anything — reasoning, writing, analysis, brainstorming."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          />
          <div style={S.row}>
            <button
              style={S.btnGenerate('var(--cyan)', loading || !prompt.trim())}
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Sparkles size={14} /> Generate</>}
            </button>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Ctrl+Enter</span>
          </div>
        </div>
        <div style={S.outputCol}>
          <div style={S.outputLabel}>
            <span style={S.outputLabelText}>Output</span>
            {output && (
              <button style={S.copyBtn} onClick={handleCopy}>
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            )}
          </div>
          <div style={S.outputBox}>
            {output ? <Markdown content={output} /> : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                Output will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCodePanel() {
    return (
      <div style={S.panelBody}>
        <div style={S.inputCol}>
          <div style={S.row}>
            <span style={S.label}>Language</span>
            <select style={S.select} value={language} onChange={e => setLanguage(e.target.value)}>
              {CODE_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <span style={S.label}>Prompt</span>
          <textarea
            style={{ ...S.textarea, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
            placeholder={`Describe the ${language} code you need...\ne.g., "Create a REST API handler with error handling and validation"`}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          />
          <div style={S.row}>
            <button
              style={S.btnGenerate('#3178C6', loading || !prompt.trim())}
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Code size={14} /> Generate Code</>}
            </button>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Ctrl+Enter</span>
          </div>
        </div>
        <div style={S.outputCol}>
          <div style={S.outputLabel}>
            <span style={S.outputLabelText}>Generated Code</span>
            {output && (
              <button style={S.copyBtn} onClick={handleCopy}>
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            )}
          </div>
          <div style={S.outputBox}>
            {output ? <Markdown content={output} /> : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                Generated code will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderImagePanel() {
    return (
      <div style={S.panelBody}>
        <div style={S.inputCol}>
          <span style={S.label}>Image Prompt</span>
          <textarea
            style={S.textarea}
            placeholder="Describe the image you want to generate...\ne.g., &quot;A futuristic city skyline at sunset with neon lights and flying vehicles&quot;"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          />
          <div style={S.row}>
            <span style={S.label}>Aspect Ratio</span>
            {ASPECT_RATIOS.map(ar => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                style={{
                  background: aspectRatio === ar ? '#F59E0B' : 'var(--bg-input)',
                  color: aspectRatio === ar ? '#000' : 'var(--text-secondary)',
                  border: `1px solid ${aspectRatio === ar ? '#F59E0B' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                {ar}
              </button>
            ))}
          </div>
          <button
            style={S.btnGenerate('#F59E0B', loading || !prompt.trim())}
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Image size={14} /> Generate Image</>}
          </button>
        </div>
        <div style={S.outputCol}>
          <span style={S.outputLabelText}>Generated Image</span>
          <div style={S.outputBox}>
            {generatedImage ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <img src={`data:image/png;base64,${generatedImage}`} alt="Generated" style={S.generatedImg} />
              </div>
            ) : output ? (
              <Markdown content={output} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem', textAlign: 'center', marginTop: '40px' }}>
                Generated image will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderVisionPanel() {
    return (
      <div style={S.panelBody}>
        <div style={S.inputCol}>
          <span style={S.label}>Upload Image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
          {imageBase64 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <img
                src={`data:${imageMimeType};base64,${imageBase64}`}
                alt={imageFileName}
                style={S.imgPreview}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{imageFileName}</span>
                <button
                  style={{ ...S.copyBtn, color: 'var(--error)' }}
                  onClick={() => { setImageBase64(''); setImageMimeType(''); setImageFileName(''); }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              style={S.dropZone(dragging)}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={24} style={{ color: dragging ? 'var(--cyan)' : 'var(--text-muted)' }} />
              <span style={S.dropText}>
                Drop an image here or click to upload<br />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PNG, JPG, WEBP, GIF</span>
              </span>
            </div>
          )}
          <span style={S.label}>Analysis Prompt (optional)</span>
          <textarea
            style={S.textareaSmall}
            placeholder="What should I analyze? e.g., &quot;Identify all objects&quot;, &quot;Extract text&quot;, &quot;Describe the composition&quot;"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          />
          <button
            style={S.btnGenerate('#10B981', loading || !imageBase64)}
            onClick={handleGenerate}
            disabled={loading || !imageBase64}
          >
            {loading ? <><Loader2 size={14} className="spin" /> Analyzing...</> : <><Eye size={14} /> Analyze Image</>}
          </button>
        </div>
        <div style={S.outputCol}>
          <div style={S.outputLabel}>
            <span style={S.outputLabelText}>Analysis</span>
            {output && (
              <button style={S.copyBtn} onClick={handleCopy}>
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            )}
          </div>
          <div style={S.outputBox}>
            {output ? <Markdown content={output} /> : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                Image analysis will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderDocumentPanel() {
    return (
      <div style={S.panelBody}>
        <div style={S.inputCol}>
          <span style={S.label}>Document Content</span>
          <textarea
            style={{ ...S.textarea, flex: 2 }}
            placeholder="Paste your document text here... Supports long-form content — articles, reports, contracts, research papers."
            value={docContent}
            onChange={e => setDocContent(e.target.value)}
          />
          <span style={S.label}>Question</span>
          <div style={S.inputRow}>
            <textarea
              style={{ ...S.textareaSmall, flex: 1 }}
              placeholder="What do you want to know about this document?"
              value={docQuestion}
              onChange={e => setDocQuestion(e.target.value)}
              rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
            />
          </div>
          <button
            style={S.btnGenerate('var(--purple)', loading || !docContent.trim() || !docQuestion.trim())}
            onClick={handleGenerate}
            disabled={loading || !docContent.trim() || !docQuestion.trim()}
          >
            {loading ? <><Loader2 size={14} className="spin" /> Analyzing...</> : <><FileSearch size={14} /> Analyze Document</>}
          </button>
        </div>
        <div style={S.outputCol}>
          <div style={S.outputLabel}>
            <span style={S.outputLabelText}>Analysis</span>
            {output && (
              <button style={S.copyBtn} onClick={handleCopy}>
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            )}
          </div>
          <div style={S.outputBox}>
            {output ? <Markdown content={output} /> : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                Document analysis will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSummarizePanel() {
    return (
      <div style={S.panelBody}>
        <div style={S.inputCol}>
          <span style={S.label}>Text to Summarize</span>
          <textarea
            style={{ ...S.textarea, flex: 2 }}
            placeholder="Paste the text you want to summarize... Articles, emails, meeting notes, reports."
            value={sumText}
            onChange={e => setSumText(e.target.value)}
          />
          <span style={S.label}>Instructions (optional)</span>
          <textarea
            style={S.textareaSmall}
            placeholder="e.g., &quot;Summarize in 3 bullet points&quot;, &quot;Focus on financial data&quot;, &quot;Executive summary format&quot;"
            value={sumInstructions}
            onChange={e => setSumInstructions(e.target.value)}
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          />
          <button
            style={S.btnGenerate('#EF4444', loading || !sumText.trim())}
            onClick={handleGenerate}
            disabled={loading || !sumText.trim()}
          >
            {loading ? <><Loader2 size={14} className="spin" /> Summarizing...</> : <><Zap size={14} /> Summarize</>}
          </button>
        </div>
        <div style={S.outputCol}>
          <div style={S.outputLabel}>
            <span style={S.outputLabelText}>Summary</span>
            {output && (
              <button style={S.copyBtn} onClick={handleCopy}>
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            )}
          </div>
          <div style={S.outputBox}>
            {output ? <Markdown content={output} /> : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                Summary will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderActivePanel() {
    if (!activeTool || !activeDef) return null;

    const panelRenderers: Record<ToolId, () => React.ReactNode> = {
      text: renderTextPanel,
      code: renderCodePanel,
      image: renderImagePanel,
      vision: renderVisionPanel,
      document: renderDocumentPanel,
      summarize: renderSummarizePanel,
    };

    return (
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={{ color: activeDef.color }}>{activeDef.icon}</span>
          <h2 style={S.panelTitle}>{activeDef.name}</h2>
          <span style={S.modelBadge(activeDef.color)}>{activeDef.model}</span>
        </div>
        {panelRenderers[activeTool]()}
      </div>
    );
  }

  /* ───── Render ───── */
  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <Sparkles size={22} style={{ color: 'var(--cyan)', marginTop: '2px' }} />
        <h1 style={S.title}>AI Studio</h1>
        <span style={S.subtitle}>Google Gen AI Suite</span>
      </div>

      {/* Tool Grid */}
      <div style={S.toolGrid}>
        {TOOLS.map(tool => (
          <div
            key={tool.id}
            style={S.toolCard(activeTool === tool.id, tool.color)}
            onClick={() => selectTool(tool.id)}
            onMouseEnter={e => {
              if (activeTool !== tool.id) {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${tool.color}60`;
                (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)';
              }
            }}
            onMouseLeave={e => {
              if (activeTool !== tool.id) {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)';
              }
            }}
          >
            <div style={S.toolCardIcon(tool.color)}>
              {tool.icon}
            </div>
            <span style={S.toolCardName}>{tool.name}</span>
            <span style={S.toolCardDesc}>{tool.description}</span>
            <span style={S.modelBadge(tool.color)}>{tool.model}</span>
          </div>
        ))}
      </div>

      {/* Active Tool Panel */}
      {activeTool ? renderActivePanel() : (
        <div style={{ ...S.panel, ...S.emptyState }}>
          <Sparkles size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-muted)' }}>
            Select a tool above to get started
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7 }}>
            Text generation, code, images, vision, document analysis, and summarization
          </span>
        </div>
      )}
    </div>
  );
}
