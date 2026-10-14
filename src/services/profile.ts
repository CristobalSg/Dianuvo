import { requireSupabase } from '../lib/supabase';
import type { Profile } from '../types/entities';

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await requireSupabase().from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, values: Pick<Profile, 'display_name' | 'timezone'>): Promise<Profile> {
  const { data, error } = await requireSupabase().from('profiles').update(values).eq('id', userId).select().single();
  if (error) throw error;
  return data as Profile;
}
