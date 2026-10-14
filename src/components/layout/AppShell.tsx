import { BarChart3, CalendarDays, Home, Plus, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { TaskOccurrence } from '../../types/entities';
import { BrandLogo } from '../ui/BrandLogo';
import { TaskSheet } from '../../features/tasks/TaskSheet';
import { TaskSheetProvider } from '../../features/tasks/TaskSheetContext';

const nav = [
  { to: '/', label: 'Hoy', icon: Home, end: true },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/statistics', label: 'Estadísticas', icon: BarChart3 },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function AppShell() {
  const [sheet, setSheet] = useState<{ open: boolean; occurrence?: TaskOccurrence }>({ open: false });
  const api = useMemo(() => ({ openTaskSheet: (occurrence?: TaskOccurrence) => setSheet({ open: true, occurrence }), closeTaskSheet: () => setSheet({ open: false }) }), []);
  return (
    <TaskSheetProvider value={api}>
      <div className="app-frame">
        <header className="app-brand-header">
          <BrandLogo size={30} showText />
        </header>
        <main className="app-content"><Outlet /></main>
        <nav className="bottom-nav" aria-label="Navegación principal">
          {nav.slice(0, 2).map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><item.icon /><span>{item.label}</span></NavLink>)}
          <button className="nav-add" onClick={() => api.openTaskSheet()} aria-label="Agregar actividad"><Plus /></button>
          {nav.slice(2).map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><item.icon /><span>{item.label}</span></NavLink>)}
        </nav>
        {sheet.open && <TaskSheet occurrence={sheet.occurrence} onClose={api.closeTaskSheet} />}
      </div>
    </TaskSheetProvider>
  );
}
