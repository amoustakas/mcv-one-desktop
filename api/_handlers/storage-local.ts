import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_ROOT = process.env.MCV_LOCAL_STORAGE_PATH || 'F:\\MCV-Desktop-SA';

function safePath(userPath: string): string {
  const resolved = path.resolve(LOCAL_ROOT, userPath);
  if (!resolved.startsWith(path.resolve(LOCAL_ROOT))) {
    throw new Error('Path traversal not allowed');
  }
  return resolved;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Local storage only available in development
  if (process.env.VERCEL) {
    return res.status(400).json({ error: 'Local storage not available in production' });
  }

  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'list': {
        const dirPath = safePath(req.body?.path || '');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const files = entries.map(entry => {
          const fullPath = path.join(dirPath, entry.name);
          const stat = fs.statSync(fullPath);
          return {
            name: entry.name,
            isFolder: entry.isDirectory(),
            size: stat.size,
            created_at: stat.birthtime.toISOString(),
            updated_at: stat.mtime.toISOString(),
          };
        });
        return res.json({ files });
      }

      case 'read': {
        const filePath = safePath(req.body?.path);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
        const content = fs.readFileSync(filePath);
        return res.json({ content: content.toString('base64'), size: content.length });
      }

      case 'write': {
        const filePath = safePath(req.body?.path);
        const content = Buffer.from(req.body?.content, 'base64');
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content);
        return res.json({ success: true, size: content.length });
      }

      case 'delete': {
        const filePath = safePath(req.body?.path);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) fs.rmSync(filePath, { recursive: true });
        else fs.unlinkSync(filePath);
        return res.json({ success: true });
      }

      case 'move': {
        const from = safePath(req.body?.from);
        const to = safePath(req.body?.to);
        const toDir = path.dirname(to);
        if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });
        fs.renameSync(from, to);
        return res.json({ success: true });
      }

      case 'mkdir': {
        const dirPath = safePath(req.body?.path);
        fs.mkdirSync(dirPath, { recursive: true });
        return res.json({ success: true });
      }

      case 'exists': {
        const checkPath = safePath(req.body?.path || '');
        return res.json({ exists: fs.existsSync(checkPath) });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
