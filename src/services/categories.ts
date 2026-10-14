import { requireSupabase } from '../lib/supabase';
import type { Category, TaskColor } from '../types/entities';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await requireSupabase().from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(userId: string, name: string, color: TaskColor): Promise<Category> {
  const { data, error } = await requireSupabase()
    .from('categories').insert({ user_id: userId, name, color }).select().single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, name: string, color: TaskColor): Promise<Category> {
  const { data, error } = await requireSupabase().from('categories').update({ name, color }).eq('id', id).select().single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await requireSupabase().from('categories').delete().eq('id', id);
  if (error) throw error;
}
