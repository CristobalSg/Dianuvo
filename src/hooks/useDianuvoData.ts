import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../features/auth/AuthProvider';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../services/categories';
import { fetchProfile, updateProfile } from '../services/profile';
import { createTask, fetchOccurrences, updateOccurrence, updateTaskFromDate } from '../services/tasks';
import type { Category, Profile, TaskDraft, TaskOccurrence, TaskColor } from '../types/entities';

export const queryKeys = {
  categories: (userId: string) => ['categories', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  occurrences: (userId: string, from: string, to: string) => ['occurrences', userId, from, to] as const,
};

export function useCategories() {
  const { user } = useAuth();
  return useQuery({ queryKey: queryKeys.categories(user?.id ?? ''), queryFn: fetchCategories, enabled: Boolean(user) });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({ queryKey: queryKeys.profile(user?.id ?? ''), queryFn: () => fetchProfile(user!.id), enabled: Boolean(user) });
}

export function useOccurrences(from: string, to = from) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.occurrences(user?.id ?? '', from, to),
    queryFn: () => fetchOccurrences(from, to),
    enabled: Boolean(user && from && to),
  });
}

export function useToggleOccurrence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (occurrence: TaskOccurrence) => updateOccurrence(occurrence.id, {
      status: occurrence.status === 'completed' ? 'pending' : 'completed',
      completed_at: occurrence.status === 'completed' ? null : new Date().toISOString(),
    }),
    onMutate: async (occurrence) => {
      await client.cancelQueries({ queryKey: ['occurrences'] });
      const snapshots = client.getQueriesData<TaskOccurrence[]>({ queryKey: ['occurrences'] });
      client.setQueriesData<TaskOccurrence[]>({ queryKey: ['occurrences'] }, (current) => current?.map((item) => item.id === occurrence.id ? {
        ...item,
        status: occurrence.status === 'completed' ? 'pending' : 'completed',
        completed_at: occurrence.status === 'completed' ? null : new Date().toISOString(),
      } : item));
      return { snapshots };
    },
    onError: (_error, _variables, context) => context?.snapshots.forEach(([key, data]) => client.setQueryData(key, data)),
    onSettled: () => client.invalidateQueries({ queryKey: ['occurrences'] }),
  });
}

export function useSaveTask() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation<unknown, Error, { draft: TaskDraft; occurrence?: TaskOccurrence; scope?: 'one' | 'future' }>({
    mutationFn: ({ draft, occurrence, scope }: { draft: TaskDraft; occurrence?: TaskOccurrence; scope?: 'one' | 'future' }) => {
      if (!occurrence) return createTask(user!.id, draft);
      if (scope === 'future') return updateTaskFromDate(occurrence.task_id, occurrence.scheduled_date, draft);
      return updateOccurrence(occurrence.id, {
        title: draft.title,
        description: draft.description || null,
        category_id: draft.category_id,
        start_time: draft.start_time,
        end_time: draft.end_time,
        color: draft.color,
      });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['occurrences'] }),
  });
}

export function useCategoryMutations() {
  const { user } = useAuth(); const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ['categories'] });
  return {
    create: useMutation({ mutationFn: ({ name, color }: { name: string; color: TaskColor }) => createCategory(user!.id, name, color), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, name, color }: Pick<Category, 'id' | 'name' | 'color'>) => updateCategory(id, name, color), onSuccess: refresh }),
    remove: useMutation({ mutationFn: deleteCategory, onSuccess: refresh }),
  };
}

export function useUpdateProfile() {
  const { user } = useAuth(); const client = useQueryClient();
  return useMutation({
    mutationFn: (values: Pick<Profile, 'display_name' | 'timezone'>) => updateProfile(user!.id, values),
    onSuccess: (profile) => client.setQueryData(queryKeys.profile(user!.id), profile),
  });
}
