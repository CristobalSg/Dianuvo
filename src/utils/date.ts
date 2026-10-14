const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date {
  if (!ISO_DATE.test(value)) throw new Error(`Fecha inválida: ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(value: string | Date, amount: number): Date {
  const result = typeof value === 'string' ? parseISODate(value) : new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const isoDay = result.getDay() || 7;
  result.setDate(result.getDate() - isoDay + 1);
  result.setHours(12, 0, 0, 0);
  return result;
}

export function getWeek(date: Date): Date[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(date);
}

export function shortWeekday(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', { weekday: 'short' }).format(date).replace('.', '').slice(0, 3);
}

export function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '';
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function monthRange(date: Date): { from: string; to: string } {
  return {
    from: toISODate(new Date(date.getFullYear(), date.getMonth(), 1, 12)),
    to: toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)),
  };
}
