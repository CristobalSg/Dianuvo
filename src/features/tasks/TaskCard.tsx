import { Check, Clock3, MoreHorizontal } from 'lucide-react';
import type { Category, TaskOccurrence } from '../../types/entities';
import { formatTime } from '../../utils/date';

export function TaskCard({ occurrence, category, onToggle, onEdit, busy }: {
  occurrence: TaskOccurrence;
  category?: Category;
  onToggle: () => void;
  onEdit: () => void;
  busy?: boolean;
}) {
  const completed = occurrence.status === 'completed';
  const disabled = occurrence.status === 'cancelled';
  return (
    <article className={`task-card ${completed ? 'completed' : ''} ${disabled ? 'cancelled' : ''}`} style={{ '--task-color': occurrence.color } as React.CSSProperties}>
      <button className="task-check" onClick={onToggle} disabled={busy || disabled} aria-label={completed ? `Desmarcar ${occurrence.title}` : `Completar ${occurrence.title}`} aria-pressed={completed}>{completed && <Check size={17} strokeWidth={3} />}</button>
      <div className="task-card-content">
        <div className="task-card-top"><span className="task-category">{category?.name ?? 'Sin categoría'}</span><button className="task-menu" onClick={onEdit} aria-label={`Editar ${occurrence.title}`}><MoreHorizontal /></button></div>
        <h3>{occurrence.title}</h3>
        {occurrence.description && <p>{occurrence.description}</p>}
        <div className="task-meta"><Clock3 size={14} />{occurrence.start_time ? <span>{formatTime(occurrence.start_time)}{occurrence.end_time ? ` — ${formatTime(occurrence.end_time)}` : ''}</span> : <span>Sin horario</span>}</div>
      </div>
    </article>
  );
}
