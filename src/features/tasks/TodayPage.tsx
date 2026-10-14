import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOccurrences, useProfile } from '../../hooks/useDianuvoData';
import { addDays, formatLongDate, greetingFor, toISODate } from '../../utils/date';
import { progressPercent } from '../../utils/recurrence';
import { TaskList } from './TaskList';
import { WeekStrip } from './WeekStrip';

const welcomeSessionKey = 'dianuvo:welcome-shown';

export function TodayPage() {
  const [selected, setSelected] = useState(() => new Date());
  const [showWelcome, setShowWelcome] = useState(() => sessionStorage.getItem(welcomeSessionKey) !== 'true');
  const date = toISODate(selected); const { data: occurrences = [], isLoading, error } = useOccurrences(date); const { data: profile } = useProfile(); const navigate = useNavigate();
  const eligible = occurrences.filter((item) => item.status !== 'cancelled');
  const completed = eligible.filter((item) => item.status === 'completed').length;
  const percent = progressPercent(completed, eligible.length);
  const firstName = profile?.display_name.split(' ')[0];
  const pendingDates = useMemo(() => new Set(occurrences.filter((item) => item.status === 'pending').map((item) => item.scheduled_date)), [occurrences]);

  useEffect(() => {
    if (!showWelcome) return;
    sessionStorage.setItem(welcomeSessionKey, 'true');
    const timeout = window.setTimeout(() => setShowWelcome(false), 4500);
    return () => window.clearTimeout(timeout);
  }, [showWelcome]);

  return <div className="page today-page">
    <header className={`day-hero${showWelcome ? ' with-welcome' : ''}`}>
      {showWelcome && <div className="day-hero-top welcome-intro"><div><span className="eyebrow">{formatLongDate(selected)}</span><h1>{greetingFor()}{firstName ? `, ${firstName}` : ''}.</h1><p>Organiza tu día a tu ritmo.</p></div><div className="hero-badge"><Sparkles /></div></div>}
      <div className="progress-copy"><span>{eligible.length ? `Has completado ${completed} de ${eligible.length} actividades` : 'Un nuevo día por comenzar'}</span><strong>{percent}%</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
    </header>
    <WeekStrip selected={selected} onSelect={setSelected} onPrevious={() => setSelected(addDays(selected, -7))} onNext={() => setSelected(addDays(selected, 7))} pendingDates={pendingDates} />
    <div className="section-heading main-list-heading"><div><span className="eyebrow">TU AGENDA</span><h2>{date === toISODate(new Date()) ? 'Para hoy' : formatLongDate(selected)}</h2></div><button onClick={() => navigate('/calendar')}>Ver calendario <ArrowRight /></button></div>
    {error && <p className="inline-error">No pudimos cargar tu agenda. Revisa la conexión e inténtalo otra vez.</p>}
    <TaskList occurrences={eligible} loading={isLoading} />
  </div>;
}
