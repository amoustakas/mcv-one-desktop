// scripts/generate-agent-portraits.ts
// Generates editorial portrait photos for every seeded agent via Gemini,
// uploads to Supabase Storage, and updates agent_persona.avatar_url.
//
// Run with:
//   VITE_GOOGLE_AI_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/generate-agent-portraits.ts
//
// Art direction (locked, per feedback_feels_real.md):
//   - Medium-close portrait, chest up
//   - Soft natural window light, single-source, shallow depth of field
//   - Confident, slightly-off-camera gaze (thinking, not posing)
//   - Warm but composed expression — not smiling for the camera
//   - Modern professional wardrobe (charcoal / navy / cream / earth tones;
//     no corporate suit-and-tie; no tech-bro hoodies)
//   - Neutral background, subtle venture-accent gradient behind the subject
//   - Style reference: Monocle magazine founder profiles, not LinkedIn headshots
//
// Per-agent: persona-specific styling (Dieter-the-designer looks different
// from Linus-the-engineer from Hedy-the-SRE). Each agent's prompt is derived
// from their persona_bio + voice + department + accent_color.

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.VITE_GOOGLE_AI_KEY ?? process.env.GOOGLE_AI_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('Required: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + VITE_GOOGLE_AI_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const genai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// Locked art direction — prepended to every generation prompt.
const ART_DIRECTION = [
  'editorial portrait photograph, Monocle magazine style',
  'medium-close framing, chest up',
  'soft natural window light from the left, single light source',
  'shallow depth of field, subject in sharp focus',
  'subject looking slightly off-camera, thoughtful expression, not smiling for the camera',
  'warm composed demeanor, confident but not posed',
  'modern professional wardrobe in charcoal navy or earth tones, no corporate suit-and-tie, no visible tech branding',
  'neutral background with a subtle soft gradient',
  'high quality, professional photography, 4:5 aspect ratio',
].join(', ');

// Per-department styling hints that flavor the portrait without violating the art direction.
const DEPARTMENT_HINTS: Record<string, string> = {
  chief_of_staff:        'subtle cosmic aesthetic in background, suggesting depth and context; outfit in deep blue-gray',
  finance_capital:       'finance professional; well-tailored charcoal blazer, crisp but understated; deliberate, calculating gaze',
  legal_risk:            'lawyer; composed and formal; subtle amber background undertone suggesting caution',
  legal:                 'lawyer; precise and clean; clean lines in the wardrobe, indigo undertones',
  ir_comms:              'communicator; warm expression, purple background undertone; approachable but sharp',
  growth_marketing:      'growth operator; sharp, contemporary wardrobe; pink background undertone; slight smile detectable',
  brand_content:         'creative director; architectural, deliberate; sky-blue undertone; minimalist styling',
  engineering_product:   'staff engineer; practical, comfortable wardrobe (quality knit or henley, not corporate); cyan undertone',
  ops_infra:             'systems engineer; calm under pressure look; teal undertone; slight intensity in the gaze',
  strategy_research:     'product strategist; reflective, intelligent; rose undertone; slight warmth',
};

async function run() {
  const { data: agents, error } = await supabase
    .from('agent_persona')
    .select('id, handle, full_name, title, department, persona_bio, accent_color')
    .eq('active', true)
    .is('avatar_url', null);
  if (error) { console.error('agent_persona fetch failed:', error); process.exit(1); }
  if (!agents || agents.length === 0) { console.log('No agents need portraits.'); return; }

  console.log(`[portraits] Generating for ${agents.length} agent(s)…`);

  for (const a of agents) {
    const hint = DEPARTMENT_HINTS[a.department] ?? '';
    const prompt = `${ART_DIRECTION}. Subject: ${a.full_name}, ${a.title}. ${hint}. Subject's persona: "${a.persona_bio.slice(0, 300)}"`;

    try {
      console.log(`  [${a.handle}] generating…`);
      const response = await genai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (p) => 'inlineData' in p && p.inlineData?.mimeType?.startsWith('image/'),
      );
      if (!imagePart || !('inlineData' in imagePart) || !imagePart.inlineData?.data) {
        console.warn(`  [${a.handle}] no image in response — skipping`);
        continue;
      }

      const imageBytes = Buffer.from(imagePart.inlineData.data, 'base64');
      const storagePath = `agents/${a.handle.replace('@', '')}.png`;

      const { error: uploadErr } = await supabase.storage
        .from('public-assets')
        .upload(storagePath, imageBytes, { contentType: 'image/png', upsert: true });
      if (uploadErr) { console.warn(`  [${a.handle}] upload failed: ${uploadErr.message}`); continue; }

      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      await supabase.from('agent_persona').update({ avatar_url: publicUrl }).eq('id', a.id);
      console.log(`  [${a.handle}] ✓ ${publicUrl}`);
    } catch (err) {
      console.error(`  [${a.handle}] failed:`, err);
    }
  }

  console.log('[portraits] done.');
}

run().catch((e) => { console.error(e); process.exit(1); });
