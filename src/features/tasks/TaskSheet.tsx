import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, Clock3, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { useToast } from '../../components/ui/ToastProvider';
import { useCategories, useSaveTask } from '../../hooks/useDianuvoData';
import { deleteTaskFromDate, fetchTask, updateOccurrence } from '../../services/tasks';
import { TASK_COLORS, type RepeatType, type TaskDraft, type TaskOccurrence } from '../../types/entities';
import { toISODate } from '../../utils/date';
import { validateTimeRange } from '../../utils/recurrence';

const DAY_OPTIONS = [
  { value: 1, label: 'L' }, { value: 2, label: 'M' }, { value: 3, label: 'M' },
  { value: 4, label: 'J' }, { value: 5, label: 'V' }, { value: 6, label: 'S' }, { value: 7, label: 'D' },
];

function emptyDraft(date?: string): TaskDraft {
  return { title: '', description: '', category_id: null, start_date: date ?? toISODate(new Date()), end_date: null, start_time: null, end_time: null, repeat_type: 'none', days_of_week: [], color: '#EBD4CC' };
}

export function TaskSheet({ occurrence, onClose }: { occurrence?: TaskOccurrence; onClose: () => void }) {
  const [draft, setDraft] = useState<TaskDraft>(() => occurrence ? {
    ...emptyDraft(occurrence.scheduled_date), title: occurrence.title, description: occurrence.description ?? '', category_id: occurrence.category_id,
    start_time: occurrence.start_time?.slice(0, 5) ?? null, end_time: occurrence.end_time?.slice(0, 5) ?? null, color: occurrence.color,
  } : emptyDraft());
  const [scope, setScope] = useState<'one' | 'future'>('one');
  const [error, setError] = useState('');
  const { data: categories = [] } = useCategories();
  const save = useSaveTask();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const taskQuery = useQuery({ queryKey: ['task', occurrence?.task_id], queryFn: () => fetchTask(occurrence!.task_id), enabled: Boolean(occurrence) });

  useEffect(() => {
    if (!taskQuery.data) return;
    setDraft((current) => ({ ...current, repeat_type: taskQuery.data.repeat_type, days_of_week: taskQuery.data.days_of_week ?? [], end_date: taskQuery.data.end_date }));
  }, [taskQuery.data]);

  const hasRecurrence = Boolean(taskQuery.data?.is_active && taskQuery.data.repeat_type !== 'none');
  const valid = useMemo(() => draft.title.trim() && validateTimeRange(draft.start_time, draft.end_time) && (draft.repeat_type !== 'custom' || draft.days_of_week.length > 0), [draft]);

  function update<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  function toggleDay(day: number) { update('days_of_week', draft.days_of_week.includes(day) ? draft.days_of_week.filter((item) => item !== day) : [...draft.days_of_week, day].sort()); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!valid) { setError('Revisa el título, horario y días de repetición.'); return; }
    try {
      await save.mutateAsync({ draft: { ...draft, title: draft.title.trim() }, occurrence, scope });
      showToast(occurrence ? 'Actividad actualizada' : 'Actividad agregada a tu agenda'); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos guardar la actividad.'); }
  }

  async function remove() {
    if (!occurrence || !window.confirm(scope === 'future' ? '¿Eliminar esta ocurrencia y las futuras?' : '¿Cancelar sólo esta ocurrencia?')) return;
    try {
      if (scope === 'future') await deleteTaskFromDate(occurrence.task_id, occurrence.scheduled_date);
      else await updateOccurrence(occurrence.id, { status: 'cancelled', completed_at: null });
      await queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      showToast('Actividad eliminada'); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos eliminarla.'); }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="task-sheet" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title">
        <div className="sheet-handle" />
        <header className="sheet-header"><div><span className="eyebrow">{occurrence ? 'EDITAR ACTIVIDAD' : 'NUEVA ACTIVIDAD'}</span><h2 id="task-sheet-title">{occurrence ? 'Ajusta tu planificación' : '¿Qué quieres hacer?'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X /></button></header>
        <form onSubmit={submit} className="task-form">
          {occurrence && hasRecurrence && <div className="scope-switch"><button type="button" className={scope === 'one' ? 'active' : ''} onClick={() => setScope('one')}>Sólo esta</button><button type="button" className={scope === 'future' ? 'active' : ''} onClick={() => setScope('future')}>Esta y futuras</button></div>}
          <Field label="Título"><Input autoFocus required maxLength={160} placeholder="Ej. Preparar presentación" value={draft.title} onChange={(e) => update('title', e.target.value)} /></Field>
          <Field label="Descripción (opcional)"><Textarea rows={2} maxLength={2000} placeholder="Añade un detalle breve" value={draft.description} onChange={(e) => update('description', e.target.value)} /></Field>
          <div className="two-columns"><Field label="Categoría"><Select value={draft.category_id ?? ''} onChange={(e) => update('category_id', e.target.value || null)}><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field><Field label="Fecha"><div className="input-with-icon"><CalendarDays /><Input type="date" disabled={Boolean(occurrence)} value={draft.start_date} onChange={(e) => update('start_date', e.target.value)} /></div></Field></div>
          <div className="two-columns"><Field label="Hora de inicio"><div className="input-with-icon"><Clock3 /><Input type="time" value={draft.start_time ?? ''} onChange={(e) => update('start_time', e.target.value || null)} /></div></Field><Field label="Hora de término"><Input type="time" value={draft.end_time ?? ''} onChange={(e) => update('end_time', e.target.value || null)} /></Field></div>
          {(!occurrence || scope === 'future') && <div className="repeat-block"><Field label="Repetición"><div className="input-with-icon"><RotateCcw /><Select value={draft.repeat_type} onChange={(e) => update('repeat_type', e.target.value as RepeatType)}><option value="none">No repetir</option><option value="daily">Todos los días</option><option value="weekly">Cada semana</option><option value="custom">Días específicos</option></Select><ChevronDown className="select-chevron" /></div></Field>{draft.repeat_type === 'custom' && <div className="day-picker" aria-label="Días de repetición">{DAY_OPTIONS.map((day) => <button key={day.value} type="button" className={draft.days_of_week.includes(day.value) ? 'selected' : ''} onClick={() => toggleDay(day.value)} aria-pressed={draft.days_of_week.includes(day.value)}>{day.label}</button>)}</div>}{draft.repeat_type !== 'none' && <Field label="Termina (opcional)"><Input type="date" min={draft.start_date} value={draft.end_date ?? ''} onChange={(e) => update('end_date', e.target.value || null)} /></Field>}</div>}
          <Field label="Color de tarjeta"><div className="color-picker">{TASK_COLORS.map((color) => <button type="button" key={color} style={{ background: color }} className={draft.color === color ? 'selected' : ''} onClick={() => update('color', color)} aria-label={`Usar color ${color}`} aria-pressed={draft.color === color} />)}</div></Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="sheet-actions">{occurrence && <Button type="button" variant="ghost" onClick={remove}><Trash2 size={18} /> Eliminar</Button>}<Button type="submit" disabled={save.isPending || !valid}>{save.isPending ? 'Guardando…' : 'Guardar actividad'}</Button></div>
        </form>
      </section>
    </div>
  );
}
