import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOccurrences } from '../../hooks/useDianuvoData';
import { addDays, formatMonth, monthRange, startOfWeek, toISODate } from '../../utils/date';
import { TaskList } from '../tasks/TaskList';

export function CalendarPage() {
  const [month, setMonth] = useState(() => new Date()); const [selected, setSelected] = useState(() => new Date());
  const range = monthRange(month); const { data: occurrences = [], isLoading } = useOccurrences(range.from, range.to);
  const grid = useMemo(() => { const first = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1, 12)); return Array.from({ length: 42 }, (_, index) => addDays(first, index)); }, [month]);
  const counts = useMemo(() => occurrences.reduce<Record<string, number>>((acc, item) => { if (item.status !== 'cancelled') acc[item.scheduled_date] = (acc[item.scheduled_date] ?? 0) + 1; return acc; }, {}), [occurrences]);
  const selectedISO = toISODate(selected); const dayItems = occurrences.filter((item) => item.scheduled_date === selectedISO);
  function moveMonth(delta: number) { const next = new Date(month.getFullYear(), month.getMonth() + delta, 1, 12); setMonth(next); setSelected(next); }
  return <div className="page calendar-page"><header className="simple-header"><span className="eyebrow">PLANIFICACIÓN</span><h1>Tu calendario</h1><p>Mira el panorama completo sin perder el detalle.</p></header><section className="month-card"><div className="month-title"><button onClick={() => moveMonth(-1)} aria-label="Mes anterior"><ChevronLeft /></button><h2>{formatMonth(month)}</h2><button onClick={() => moveMonth(1)} aria-label="Mes siguiente"><ChevronRight /></button></div><div className="month-weekdays">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="month-grid">{grid.map((date) => { const value = toISODate(date); const inMonth = date.getMonth() === month.getMonth(); return <button key={value} className={`${inMonth ? '' : 'outside'} ${value === selectedISO ? 'selected' : ''} ${value === toISODate(new Date()) ? 'today' : ''}`} onClick={() => setSelected(date)}><span>{date.getDate()}</span>{counts[value] > 0 && <i>{counts[value]}</i>}</button>; })}</div></section><div className="section-heading"><h2>{new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(selected)}</h2><span>{dayItems.filter((item) => item.status !== 'cancelled').length}</span></div><TaskList occurrences={dayItems} loading={isLoading} /></div>;
}
