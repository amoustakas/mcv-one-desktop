import { requireAuth } from './_auth';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.body?.action;

  try {
    switch (action) {
      case 'sync': {
        // Sync Clerk user to team_members table
        const { clerk_user_id, name, email, avatar_url } = req.body;
        if (!clerk_user_id || !email) return res.status(400).json({ error: 'clerk_user_id and email required' });

        // Check if member exists
        const { data: existing } = await supabase.from('team_members')
          .select('*').eq('clerk_user_id', clerk_user_id).maybeSingle();

        if (existing) {
          // Update last_active and any changed fields
          const { data, error } = await supabase.from('team_members')
            .update({
              name: name || existing.name,
              email: email || existing.email,
              avatar_url: avatar_url || existing.avatar_url,
              last_active: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id).select().single();
          if (error) throw error;
          return res.json({ member: data, created: false });
        }

        // Create new team member
        const { data, error } = await supabase.from('team_members').insert({
          clerk_user_id,
          name: name || email.split('@')[0],
          email,
          avatar_url: avatar_url || '',
          role: 'admin', // First user gets admin (Tony)
          status: 'active',
          last_active: new Date().toISOString(),
          venture_assignments: ['mcv'], // Default to MCV
        }).select().single();
        if (error) throw error;

        // Create a welcome notification
        await supabase.from('notifications').insert({
          type: 'success',
          title: `Welcome, ${data.name}!`,
          description: 'Your MCV One account has been set up.',
          source: 'system',
        });

        return res.json({ member: data, created: true });
      }

      case 'me': {
        // Get current user's team member record
        const { clerk_user_id } = req.body;
        const { data } = await supabase.from('team_members')
          .select('*').eq('clerk_user_id', clerk_user_id).maybeSingle();
        return res.json({ member: data });
      }

      case 'update-profile': {
        const { clerk_user_id, ...updates } = req.body;
        const { data, error } = await supabase.from('team_members')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('clerk_user_id', clerk_user_id).select().single();
        if (error) throw error;
        return res.json({ member: data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
