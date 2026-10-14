export const TASK_COLORS = ['#514945', '#894242', '#D55C5A', '#F5918F', '#EBD4CC'] as const;
export type TaskColor = (typeof TASK_COLORS)[number];
export type RepeatType = 'none' | 'daily' | 'weekly' | 'custom';
export type OccurrenceStatus = 'pending' | 'completed' | 'skipped' | 'cancelled';

export interface Profile {
  id: string;
  display_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: TaskColor;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  series_id: string;
  previous_task_id: string | null;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  repeat_type: RepeatType;
  days_of_week: number[] | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  color: TaskColor;
  created_at: string;
  updated_at: string;
}

export interface TaskOccurrence {
  id: string;
  task_id: string;
  series_id: string;
  user_id: string;
  category_id: string | null;
  scheduled_date: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  color: TaskColor;
  status: OccurrenceStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  category_id: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  repeat_type: RepeatType;
  days_of_week: number[];
  color: TaskColor;
}
