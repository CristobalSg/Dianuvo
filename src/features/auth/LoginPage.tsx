import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { signIn } from '../../services/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await signIn(email, password);
      const destination = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos iniciar sesión.');
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-card">
      <span className="eyebrow">BIENVENIDA/O</span>
      <h2>Continúa organizando tu día</h2>
      <p className="muted">Ingresa con el correo de tu cuenta.</p>
      <form onSubmit={submit} className="form-stack">
        <Field label="Correo electrónico"><Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Contraseña"><Input type="password" autoComplete="current-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-row-between"><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></div>
        <Button type="submit" full disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</Button>
      </form>
      <p className="auth-switch">¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link></p>
    </div>
  );
}
