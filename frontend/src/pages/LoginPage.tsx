import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ErrorState } from '../components/Feedback';

export function LoginPage() {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = (location.state as { from?: string } | null)?.from || '/';

  if (user) return <div className="mx-auto max-w-xl surface-card"><h1 className="text-2xl font-semibold text-emerald-950">You’re signed in</h1><p className="mt-2 text-slate-600">Signed in as {user.username}.</p><Link className="btn-primary mt-5" to={user.is_staff ? '/admin' : '/'}>Continue</Link></div>;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const username = String(data.get('username') ?? '');
    const password = String(data.get('password') ?? '');
    try {
      if (registering) {
        await register({ username, email: String(data.get('email') ?? ''), password, password_confirm: String(data.get('password_confirm') ?? '') });
      } else {
        await login(username, password);
      }
      navigate(redirect, { replace: true });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Authentication request failed. Please try again.');
    } finally { setBusy(false); }
  }

  return <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm md:grid-cols-[.8fr_1.2fr]">
    <aside className="bg-emerald-950 p-7 text-white sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-800"><Leaf aria-hidden="true" /></span><h1 className="mt-6 text-2xl font-semibold">Your community, working together.</h1><p className="mt-3 text-sm leading-6 text-emerald-100/80">Sign in to submit waste reports and keep track of the work you contribute.</p></aside>
    <section className="p-6 sm:p-9"><p className="section-eyebrow">RecycleIQ account</p><h2 className="mt-2 text-2xl font-semibold text-emerald-950">{registering ? 'Create account' : 'Welcome back'}</h2><p className="mt-2 text-sm text-slate-600">{registering ? 'Create an account to submit and track reports.' : 'Enter your credentials to continue.'}</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error && <ErrorState message={error} />}
        <div><label className="field-label" htmlFor="username">Username</label><input className="field-input" id="username" name="username" autoComplete="username" minLength={3} required /></div>
        {registering && <div><label className="field-label" htmlFor="email">Email</label><input className="field-input" id="email" name="email" type="email" autoComplete="email" required /></div>}
        <div><label className="field-label" htmlFor="password">Password</label><input className="field-input" id="password" name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={8} required /></div>
        {registering && <div><label className="field-label" htmlFor="password_confirm">Confirm password</label><input className="field-input" id="password_confirm" name="password_confirm" type="password" autoComplete="new-password" minLength={8} required /></div>}
        <button className="btn-primary w-full" type="submit" disabled={busy}>{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">{registering ? 'Already registered?' : 'New to RecycleIQ?'} <button className="font-semibold text-emerald-800 underline-offset-4 hover:underline" onClick={() => { setRegistering((value) => !value); setError(''); }}>{registering ? 'Sign in' : 'Create an account'}</button></p>
    </section>
  </div>;
}