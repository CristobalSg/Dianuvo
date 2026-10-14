import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getWeek, parseISODate, toISODate } from '../src/utils/date.ts';
import { datesForRule, displayStatus, occursOnDate, progressPercent, splitSeriesDates, validateTimeRange } from '../src/utils/recurrence.ts';

test('calcula reglas no recurrentes, diarias y semanales', () => {
  assert.equal(occursOnDate({ repeat_type: 'none', start_date: '2026-10-14', end_date: null, days_of_week: null }, '2026-10-15'), false);
  assert.equal(occursOnDate({ repeat_type: 'daily', start_date: '2026-10-14', end_date: '2026-10-16', days_of_week: null }, '2026-10-16'), true);
  assert.deepEqual(datesForRule({ repeat_type: 'weekly', start_date: '2026-10-14', end_date: null, days_of_week: null }, '2026-10-14', '2026-11-04'), ['2026-10-14', '2026-10-21', '2026-10-28', '2026-11-04']);
});

test('selecciona días ISO para una regla personalizada sin duplicados', () => {
  const dates = datesForRule({ repeat_type: 'custom', start_date: '2026-10-01', end_date: null, days_of_week: [1, 3, 5] }, '2026-10-12', '2026-10-18');
  assert.deepEqual(dates, ['2026-10-12', '2026-10-14', '2026-10-16']);
  assert.equal(new Set(dates).size, dates.length);
});

test('la semana comienza en lunes y conserva fechas locales', () => {
  const date = parseISODate('2026-10-14');
  assert.equal(toISODate(date), '2026-10-14');
  assert.deepEqual(getWeek(date).map(toISODate), ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
});

test('valida horarios sin impedir actividades sin hora', () => {
  assert.equal(validateTimeRange(null, null), true);
  assert.equal(validateTimeRange('09:00', '11:00'), true);
  assert.equal(validateTimeRange('11:00', '09:00'), false);
  assert.equal(validateTimeRange('09:00', '09:00'), false);
});

test('calcula progreso acotado y evita división por cero', () => {
  assert.equal(progressPercent(4, 8), 50);
  assert.equal(progressPercent(0, 0), 0);
  assert.equal(progressPercent(12, 8), 100);
});

test('distingue pendientes actuales de omitidas pasadas', () => {
  assert.equal(displayStatus('pending', '2026-10-13', '2026-10-14'), 'missed');
  assert.equal(displayStatus('pending', '2026-10-14', '2026-10-14'), 'pending');
  assert.equal(displayStatus('completed', '2026-10-13', '2026-10-14'), 'completed');
});

test('dividir una serie conserva el tramo histórico', () => {
  assert.deepEqual(splitSeriesDates('2026-10-01', '2026-10-14'), { previousEnd: '2026-10-13', nextStart: '2026-10-14' });
  assert.throws(() => splitSeriesDates('2026-10-14', '2026-10-14'));
});

test('el SQL protege materialización e integridad por usuario', async () => {
  const sql = await readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
  assert.match(sql, /unique \(task_id, scheduled_date\)/i);
  assert.match(sql, /occurrences_series_date_unique unique \(user_id, series_id, scheduled_date\)/i);
  assert.match(sql, /on conflict do nothing/i);
  assert.match(sql, /foreign key \(category_id, user_id\)/i);
  assert.match(sql, /enable row level security/gi);
});
