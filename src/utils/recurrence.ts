export interface RecurrenceRule {
  repeat_type: 'none' | 'daily' | 'weekly' | 'custom';
  start_date: string;
  end_date: string | null;
  days_of_week: number[] | null;
}

function dateAtNoon(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function iso(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function isoWeekday(date: Date): number {
  return date.getDay() || 7;
}

export function occursOnDate(rule: RecurrenceRule, date: string): boolean {
  if (date < rule.start_date || (rule.end_date && date > rule.end_date)) return false;
  if (rule.repeat_type === 'none') return date === rule.start_date;
  if (rule.repeat_type === 'daily') return true;

  const current = dateAtNoon(date);
  if (rule.repeat_type === 'custom') return Boolean(rule.days_of_week?.includes(isoWeekday(current)));

  const start = dateAtNoon(rule.start_date);
  const elapsedDays = Math.round((current.getTime() - start.getTime()) / 86_400_000);
  return elapsedDays % 7 === 0;
}

export function datesForRule(rule: RecurrenceRule, from: string, to: string): string[] {
  if (to < from) return [];
  const dates: string[] = [];
  const cursor = dateAtNoon(from);
  const end = dateAtNoon(to);
  while (cursor <= end) {
    const value = iso(cursor);
    if (occursOnDate(rule, value)) dates.push(value);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function validateTimeRange(start: string | null, end: string | null): boolean {
  if (!start || !end) return true;
  return end > start;
}

export function progressPercent(completed: number, eligible: number): number {
  if (eligible <= 0) return 0;
  return Math.round((Math.max(0, Math.min(completed, eligible)) / eligible) * 100);
}

export function displayStatus(
  status: 'pending' | 'completed' | 'skipped' | 'cancelled',
  scheduledDate: string,
  today: string,
): 'pending' | 'completed' | 'skipped' | 'cancelled' | 'missed' {
  if (status === 'pending' && scheduledDate < today) return 'missed';
  return status;
}

export function splitSeriesDates(seriesStart: string, splitDate: string): { previousEnd: string; nextStart: string } {
  const start = dateAtNoon(seriesStart);
  const split = dateAtNoon(splitDate);
  if (split <= start) throw new Error('La división debe ser posterior al inicio de la serie');
  const previous = new Date(split);
  previous.setDate(previous.getDate() - 1);
  return { previousEnd: iso(previous), nextStart: iso(split) };
}
