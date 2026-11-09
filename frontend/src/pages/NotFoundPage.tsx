import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <div className="mx-auto max-w-xl surface-card text-center"><p className="section-eyebrow">404 · Page not found</p><h1 className="mt-2 text-3xl font-semibold text-emerald-950">We couldn’t find that page.</h1><p className="mt-3 text-slate-600">The address may have changed or may not exist.</p><Link className="btn-primary mt-6" to="/">Return home</Link></div>;
}