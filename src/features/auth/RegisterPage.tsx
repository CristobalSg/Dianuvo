import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { signUp } from '../../services/auth';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try {
      const result = await signUp(form.email, form.password, form.name);
      if (result.session) navigate('/');
      else setMessage('Revisa tu correo para confirmar la cuenta.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos crear la cuenta.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-card">
      <span className="eyebrow">EMPIEZA HOY</span><h2>Crea tu espacio personal</h2>
      <p className="muted">Un lugar tranquilo para ordenar lo cotidiano.</p>
      <form onSubmit={submit} className="form-stack">
        <Field label="Tu nombre"><Input required maxLength={80} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Correo electrónico"><Input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres"><Input required type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Repite la contraseña"><Input required type="password" minLength={8} autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></Field>
        {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success">{message}</p>}
        <Button type="submit" full disabled={busy}>{busy ? 'Creando…' : 'Crear mi cuenta'}</Button>
      </form>
      <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></p>
    </div>
  );
}
