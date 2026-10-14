import { Link, Outlet } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';

export function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <Link to="/" className="auth-logo" aria-label="Dianuvo">
          <BrandLogo size={42} variant="light" showText />
        </Link>
        <div>
          <span className="eyebrow">DIANUVO</span>
          <h1>Haz espacio para<br />lo que importa.</h1>
          <p>Tu día, tus rutinas y tu progreso en un mismo lugar.</p>
        </div>
        <div className="auth-orbit" aria-hidden="true"><span /><span /><span /></div>
      </section>
      <section className="auth-form-panel"><Outlet /></section>
    </main>
  );
}
