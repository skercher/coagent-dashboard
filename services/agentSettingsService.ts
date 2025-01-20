import { supabase } from './supabaseClient';

export interface AgentSettings {
  id: string;
  agent_id: string;
  first_message: string | null;
  system_prompt: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAgentSettings(agentId: string): Promise<AgentSettings | null> {
  const { data, error } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('agent_id', agentId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching agent settings:', error);
    return null;
  }

  return data;
}

export async function upsertAgentSettings(settings: Partial<AgentSettings> & { agent_id: string }) {
  const { data, error } = await supabase
    .from('agent_settings')
    .upsert({
      agent_id: settings.agent_id,
      first_message: settings.first_message || null,
      system_prompt: settings.system_prompt || null,
      website_url: settings.website_url || null,
    }, {
      onConflict: 'agent_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting agent settings:', error);
    throw error;
  }

  return data;
}
