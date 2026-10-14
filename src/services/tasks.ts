import { requireSupabase } from '../lib/supabase';
import type { Task, TaskDraft, TaskOccurrence } from '../types/entities';

export async function materializeOccurrences(from: string, to: string): Promise<void> {
  const { error } = await requireSupabase().rpc('materialize_task_occurrences', { p_from: from, p_to: to });
  if (error) throw error;
}

export async function fetchOccurrences(from: string, to: string): Promise<TaskOccurrence[]> {
  await materializeOccurrences(from, to);
  const { data, error } = await requireSupabase()
    .from('task_occurrences')
    .select('*')
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .order('scheduled_date')
    .order('start_time', { nullsFirst: false });
  if (error) throw error;
  return data as TaskOccurrence[];
}

export async function fetchTask(id: string): Promise<Task> {
  const { data, error } = await requireSupabase().from('tasks').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Task;
}

export async function createTask(userId: string, draft: TaskDraft): Promise<Task> {
  const { data, error } = await requireSupabase().from('tasks').insert({
    user_id: userId,
    ...draft,
    description: draft.description || null,
    days_of_week: draft.repeat_type === 'custom' ? draft.days_of_week : null,
  }).select().single();
  if (error) throw error;
  const task = data as Task;
  const windowEnd = new Date(`${task.start_date}T12:00:00`);
  windowEnd.setDate(windowEnd.getDate() + 60);
  const sixtyDays = `${windowEnd.getFullYear()}-${String(windowEnd.getMonth() + 1).padStart(2, '0')}-${String(windowEnd.getDate()).padStart(2, '0')}`;
  const materializeTo = task.end_date && task.end_date < sixtyDays ? task.end_date : sixtyDays;
  await materializeOccurrences(task.start_date, materializeTo);
  return task;
}

export async function updateOccurrence(
  id: string,
  values: Partial<Pick<TaskOccurrence, 'title' | 'description' | 'category_id' | 'start_time' | 'end_time' | 'color' | 'status' | 'completed_at'>>,
): Promise<TaskOccurrence> {
  const { data, error } = await requireSupabase().from('task_occurrences').update(values).eq('id', id).select().single();
  if (error) throw error;
  return data as TaskOccurrence;
}

export async function updateTaskFromDate(taskId: string, fromDate: string, draft: TaskDraft): Promise<string> {
  const { data, error } = await requireSupabase().rpc('update_task_from_date', {
    p_task_id: taskId,
    p_from_date: fromDate,
    p_title: draft.title,
    p_description: draft.description || null,
    p_category_id: draft.category_id,
    p_start_time: draft.start_time,
    p_end_time: draft.end_time,
    p_repeat_type: draft.repeat_type,
    p_days_of_week: draft.repeat_type === 'custom' ? draft.days_of_week : null,
    p_end_date: draft.end_date,
    p_color: draft.color,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteTaskFromDate(taskId: string, fromDate: string): Promise<void> {
  const { error } = await requireSupabase().rpc('cancel_task_from_date', { p_task_id: taskId, p_from_date: fromDate });
  if (error) throw error;
}
