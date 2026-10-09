import { supabase } from './supabaseClient';

export interface Profile {
  id: string;
  display_name: string | null;
  xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  beginner_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function deleteMyAccount(): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
}
