import { Download, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useCategories, useOccurrences } from '../../hooks/useDianuvoData';
import { addDays, monthRange, startOfWeek, toISODate } from '../../utils/date';
import { displayStatus, progressPercent } from '../../utils/recurrence';

type Period = 'week' | 'month';

export function StatisticsPage() {
  const [period, setPeriod] = useState<Period>('week'); const todayDate = new Date(); const today = toISODate(todayDate);
  const range = period === 'week' ? { from: toISODate(startOfWeek(todayDate)), to: today } : { ...monthRange(todayDate), to: today };
  const { data: occurrences = [], isLoading } = useOccurrences(range.from, range.to); const { data: categories = [] } = useCategories();
  const active = occurrences.filter((item) => item.status !== 'cancelled'); const completed = active.filter((item) => item.status === 'completed').length;
  const pending = active.filter((item) => displayStatus(item.status, item.scheduled_date, today) === 'pending').length;
  const missed = active.filter((item) => ['missed', 'skipped'].includes(displayStatus(item.status, item.scheduled_date, today))).length;
  const percent = progressPercent(completed, active.length);
  const days = useMemo(() => { const result: { date: string; completed: number; total: number }[] = []; let cursor = new Date(`${range.from}T12:00:00`); const end = new Date(`${range.to}T12:00:00`); while (cursor <= end) { const date = toISODate(cursor); const items = active.filter((item) => item.scheduled_date === date); result.push({ date, completed: items.filter((item) => item.status === 'completed').length, total: items.length }); cursor = addDays(cursor, 1); } return result; }, [active, range.from, range.to]);
  const categoryStats = categories.map((category) => { const items = active.filter((item) => item.category_id === category.id); return { ...category, total: items.length, completed: items.filter((item) => item.status === 'completed').length }; }).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);

  async function exportPdf() {
    const { jsPDF } = await import('jspdf'); const pdf = new jsPDF();
    pdf.setTextColor(81, 73, 69); pdf.setFontSize(22); pdf.text('Dianuvo — Resumen de progreso', 18, 22);
    pdf.setFontSize(11); pdf.text(`Período: ${range.from} a ${range.to}`, 18, 32); pdf.text(`Cumplimiento: ${percent}%`, 18, 45); pdf.text(`Programadas: ${active.length}   Completadas: ${completed}   Pendientes: ${pending}   Omitidas: ${missed}`, 18, 53);
    let y = 70; categoryStats.forEach((item) => { pdf.text(`${item.name}: ${item.completed}/${item.total} (${progressPercent(item.completed, item.total)}%)`, 18, y); y += 9; });
    pdf.save(`dianuvo-${period}-${today}.pdf`);
  }

  return <div className="page stats-page"><header className="simple-header stats-header"><div><span className="eyebrow">TU PROGRESO</span><h1>Pequeños pasos,<br />grandes cambios.</h1></div><div className="trend-badge"><TrendingUp /></div></header><div className="segmented"><button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Esta semana</button><button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Este mes</button></div>{isLoading ? <div className="stats-skeleton" /> : <><section className="score-card"><div className="score-ring" style={{ '--progress': `${percent * 3.6}deg` } as React.CSSProperties}><div><strong>{percent}%</strong><span>cumplido</span></div></div><div><span className="eyebrow">BALANCE</span><h2>{percent >= 80 ? 'Un ritmo excelente' : percent >= 50 ? 'Vas por buen camino' : 'Cada avance cuenta'}</h2><p>{completed} de {active.length} actividades completadas.</p></div></section><section className="metric-grid"><article><strong>{active.length}</strong><span>Programadas</span></article><article><strong>{completed}</strong><span>Completadas</span></article><article><strong>{pending}</strong><span>Pendientes hoy</span></article><article><strong>{missed}</strong><span>Omitidas</span></article></section><section className="chart-card"><div className="section-heading"><div><span className="eyebrow">CONSTANCIA</span><h2>Cumplimiento diario</h2></div></div><div className={`daily-bars ${period === 'month' ? 'monthly' : ''}`}>{days.map((day) => { const value = progressPercent(day.completed, day.total); return <div className="bar-column" key={day.date} title={`${day.date}: ${value}%`}><div className="bar-track"><span style={{ height: `${value}%` }} /></div><small>{new Intl.DateTimeFormat('es-CL', { weekday: 'narrow' }).format(new Date(`${day.date}T12:00:00`))}</small></div>; })}</div></section><section className="chart-card"><div className="section-heading"><div><span className="eyebrow">ÁREAS</span><h2>Por categoría</h2></div></div><div className="category-bars">{categoryStats.length ? categoryStats.map((item) => <div className="category-stat" key={item.id}><div><span><i style={{ background: item.color }} />{item.name}</span><strong>{progressPercent(item.completed, item.total)}%</strong></div><div className="mini-track"><span style={{ width: `${progressPercent(item.completed, item.total)}%`, background: item.color }} /></div><small>{item.completed} de {item.total} completadas</small></div>) : <p className="muted">Aún no hay datos para este período.</p>}</div></section><Button variant="secondary" full onClick={exportPdf}><Download size={18} /> Descargar resumen PDF</Button></>}</div>;
}
