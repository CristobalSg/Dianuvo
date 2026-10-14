/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';
import type { TaskOccurrence } from '../../types/entities';

interface TaskSheetApi {
  openTaskSheet: (occurrence?: TaskOccurrence) => void;
  closeTaskSheet: () => void;
}

export const TaskSheetContext = createContext<TaskSheetApi | null>(null);

export function TaskSheetProvider({ value, children }: { value: TaskSheetApi; children: ReactNode }) {
  return <TaskSheetContext.Provider value={value}>{children}</TaskSheetContext.Provider>;
}

export function useTaskSheet() {
  const value = useContext(TaskSheetContext);
  if (!value) throw new Error('useTaskSheet debe usarse dentro de TaskSheetProvider');
  return value;
}
