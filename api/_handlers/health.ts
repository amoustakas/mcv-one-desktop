import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const keys = {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_KEY: !!(process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY),
    GOOGLE_MAPS_KEY: !!(process.env.GOOGLE_MAPS_KEY || process.env.VITE_GOOGLE_MAPS_KEY),
    GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
    VERCEL_TOKEN: !!process.env.VERCEL_TOKEN,
    DEEPGRAM_API_KEY: !!(process.env.DEEPGRAM_API_KEY || process.env.VITE_DEEPGRAM_API_KEY),
    ELEVENLABS_API_KEY: !!(process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY),
    SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    CLERK_PUBLISHABLE_KEY: !!(process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    NOTION_API_KEY: !!(process.env.NOTION_API_KEY || process.env.NOTION_TOKEN),
    GOOGLE_DRIVE_KEY: !!(process.env.GOOGLE_DRIVE_KEY || process.env.GOOGLE_API_KEY),
    CLOUDFLARE_API_TOKEN: !!process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    N8N_API_KEY: !!process.env.N8N_API_KEY,
    N8N_BASE_URL: !!process.env.N8N_BASE_URL,
  };

  // Also check env var names that exist (just names, not values)
  const allEnvNames = Object.keys(process.env).filter(
    (k) => k.includes('KEY') || k.includes('TOKEN') || k.includes('SECRET') || k.includes('URL') || k.includes('SUPABASE') || k.includes('CLERK') || k.includes('GOOGLE') || k.includes('ANTHROPIC') || k.includes('DEEPGRAM') || k.includes('ELEVEN') || k.includes('CLOUDFLARE') || k.includes('N8N') || k.includes('NOTION')
  ).sort();

  return res.json({
    status: 'healthy',
    version: '5.4.0',
    configured: keys,
    env_names: allEnvNames,
  });
}
