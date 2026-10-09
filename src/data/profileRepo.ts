import { supabase } from './supabaseClient';
import { withRetry } from './retry';

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

export type ProfilePatch = Partial<
  Pick<Profile, 'display_name' | 'xp' | 'current_streak' | 'longest_streak' | 'last_active_date' | 'beginner_completed_at'>
>;

export function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

export function getProfile(userId: string): Promise<Profile> {
  return withRetry(async () => {
    const { data, error } = await requireClient().from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data as Profile;
  });
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<void> {
  const { error } = await requireClient().from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function deleteMyAccount(): Promise<void> {
  const { error } = await requireClient().rpc('delete_my_account');
  if (error) throw error;
}
