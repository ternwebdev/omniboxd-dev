import { supabase } from './supabase';

export interface UserAchievement {
  achievement_slug: string;
  unlocked_at: string;
}

export async function fetchUserAchievements(userId?: string | null): Promise<UserAchievement[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_slug, unlocked_at')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: true });

  if (error) {
    console.warn('Supabase fetchUserAchievements error:', error.message);
    return [];
  }

  return (data || []) as UserAchievement[];
}
