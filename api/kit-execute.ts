import { requireAuth } from "./_auth";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Server-Side Kit Execution
// ---------------------------------------------------------------------------
// Executes kit tool handlers in a restricted server-side context.
// Used for kits that need credentials or Node.js APIs not available in browser.

// Registry of server-side kit handlers (populated by kit installation)
// For Phase 2, this is a placeholder. Phase 4 will add dynamic registration.
const serverKitHandlers: Record<string, Record<string, (
  input: Record<string, unknown>,
  context: { ventureId: string; userId: string },
) => Promise<unknown>>> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { kitId, toolName, input, ventureId } = req.body;

  if (!kitId || !toolName) {
    return res.status(400).json({ error: 'kitId and toolName are required' });
  }

  try {
    // Look up the kit's server-side handler
    const kitHandlers = serverKitHandlers[kitId];
    if (!kitHandlers) {
      return res.status(404).json({
        success: false,
        error: `Kit "${kitId}" has no server-side handlers registered`,
      });
    }

    const toolHandler = kitHandlers[toolName];
    if (!toolHandler) {
      return res.status(404).json({
        success: false,
        error: `Tool "${toolName}" not found in kit "${kitId}"`,
      });
    }

    const result = await toolHandler(input || {}, {
      ventureId: ventureId || '',
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
