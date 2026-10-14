import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeek, shortWeekday, toISODate } from '../../utils/date';

export function WeekStrip({ selected, onSelect, onPrevious, onNext, pendingDates = new Set<string>() }: {
  selected: Date;
  onSelect: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  pendingDates?: Set<string>;
}) {
  const week = getWeek(selected); const selectedISO = toISODate(selected); const today = toISODate(new Date());
  return <section className="week-panel" aria-label="Calendario semanal"><div className="week-controls"><button onClick={onPrevious} aria-label="Semana anterior"><ChevronLeft /></button><strong>{new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(selected)}</strong><button onClick={onNext} aria-label="Semana siguiente"><ChevronRight /></button></div><div className="week-days">{week.map((date) => { const value = toISODate(date); return <button key={value} className={`${value === selectedISO ? 'selected' : ''} ${value === today ? 'today' : ''}`} onClick={() => onSelect(date)} aria-pressed={value === selectedISO}><span>{shortWeekday(date)}</span><strong>{date.getDate()}</strong>{pendingDates.has(value) && <i />}</button>; })}</div></section>;
}
