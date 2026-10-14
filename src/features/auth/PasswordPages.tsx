import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { requestPasswordReset, updatePassword } from '../../services/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { await requestPasswordReset(email); setMessage('Si existe una cuenta, recibirás un enlace para restablecerla.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos enviar el enlace.'); } finally { setBusy(false); } }
  return <div className="auth-card"><span className="eyebrow">RECUPERAR ACCESO</span><h2>Restablece tu contraseña</h2><p className="muted">Te enviaremos un enlace seguro.</p><form onSubmit={submit} className="form-stack"><Field label="Correo electrónico"><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<Button type="submit" full disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</Button></form><p className="auth-switch"><Link to="/login">Volver al inicio</Link></p></div>;
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); try { await updatePassword(password); navigate('/'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar.'); } finally { setBusy(false); } }
  return <div className="auth-card"><span className="eyebrow">NUEVA CONTRASEÑA</span><h2>Protege tu cuenta</h2><form onSubmit={submit} className="form-stack"><Field label="Nueva contraseña"><Input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>{error && <p className="form-error">{error}</p>}<Button type="submit" full disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</Button></form></div>;
}
