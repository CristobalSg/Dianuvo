import { CalendarPlus } from 'lucide-react';
import { useMemo } from 'react';
import { useToast } from '../../components/ui/ToastProvider';
import { useCategories, useToggleOccurrence } from '../../hooks/useDianuvoData';
import type { TaskOccurrence } from '../../types/entities';
import { useTaskSheet } from './TaskSheetContext';
import { TaskCard } from './TaskCard';

export function TaskList({ occurrences, loading }: { occurrences: TaskOccurrence[]; loading?: boolean }) {
  const { data: categories = [] } = useCategories();
  const toggle = useToggleOccurrence();
  const { openTaskSheet } = useTaskSheet();
  const { showToast } = useToast();
  const categoriesById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const timed = occurrences.filter((item) => item.start_time && item.status !== 'cancelled');
  const untimed = occurrences.filter((item) => !item.start_time && item.status !== 'cancelled');

  async function onToggle(item: TaskOccurrence) {
    try { await toggle.mutateAsync(item); }
    catch { showToast('No pudimos actualizar la actividad. Se restauró su estado.', 'error'); }
  }

  if (loading) return <div className="task-skeletons">{[1, 2, 3].map((item) => <div className="task-skeleton" key={item} />)}</div>;
  if (!occurrences.some((item) => item.status !== 'cancelled')) return <div className="empty-state"><div className="empty-icon"><CalendarPlus /></div><h3>Tu día está despejado</h3><p>Agrega una actividad y empieza a darle forma.</p><button onClick={() => openTaskSheet()}>Agregar mi primera actividad</button></div>;

  return <>
    {timed.length > 0 && <div className="timeline">{timed.map((item) => <div className="timeline-row" key={item.id}><div className="timeline-time">{item.start_time?.slice(0, 5)}</div><div className="timeline-rail"><span /></div><TaskCard occurrence={item} category={item.category_id ? categoriesById.get(item.category_id) : undefined} onToggle={() => onToggle(item)} onEdit={() => openTaskSheet(item)} busy={toggle.isPending} /></div>)}</div>}
    {untimed.length > 0 && <section className="untimed-section"><div className="section-heading"><h2>Pendientes sin hora</h2><span>{untimed.length}</span></div><div className="untimed-list">{untimed.map((item) => <TaskCard key={item.id} occurrence={item} category={item.category_id ? categoriesById.get(item.category_id) : undefined} onToggle={() => onToggle(item)} onEdit={() => openTaskSheet(item)} busy={toggle.isPending} />)}</div></section>}
  </>;
}
