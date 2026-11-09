import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Send } from 'lucide-react';
import { ApiError } from '../api/client';
import { getCategories, submitReport } from '../api/recycleiq';
import { useAuth } from '../auth/AuthContext';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import type { Category, WasteReport } from '../types';

export function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<WasteReport | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Could not load report categories.')).finally(() => setLoadingCategories(false));
  }, []);

  if (authLoading) return <LoadingState label="Checking your account…" />;
  if (!user) return <div className="mx-auto max-w-2xl surface-card text-center"><h1 className="text-2xl font-semibold text-emerald-950">Sign in to submit a report</h1><p className="mt-2 text-slate-600">Reports are linked to your account and start in pending review.</p><Link className="btn-primary mt-5" to="/login" state={{ from: '/reports/new' }}>Sign in or create an account</Link></div>;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSaving(true);
    const data = new FormData(form);
    const photo = data.get('photo');
    try {
      const report = await submitReport({
        category: String(data.get('category')),
        description: String(data.get('description')),
        latitude: Number(data.get('latitude')),
        longitude: Number(data.get('longitude')),
        photo: photo instanceof File && photo.size ? photo : undefined,
      });
      setSubmitted(report);
      form.reset();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not submit the report. Check your connection and try again.');
    } finally { setSaving(false); }
  }

  return <div>
    <PageHeader eyebrow="Community reporting" title="Submit a waste report" description="Add a location and a short description. Your report remains private until an administrator approves it." />
    {submitted ? <div className="mx-auto max-w-2xl"><div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status"><h2 className="font-semibold text-emerald-950">Report submitted</h2><p className="mt-1 text-sm leading-6 text-emerald-900">The API created report #{submitted.id} with status “{submitted.status}”. It is not public until approved.</p></div><button className="btn-primary" onClick={() => setSubmitted(null)}>Submit another report</button></div> : loadingCategories ? <LoadingState label="Loading categories…" /> : error && categories.length === 0 ? <ErrorState message={error} onRetry={() => { setError(''); setLoadingCategories(true); getCategories().then(setCategories).catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Could not load report categories.')).finally(() => setLoadingCategories(false)); }} /> : categories.length === 0 ? <EmptyState title="Categories are not available" body="The API has not returned any reporting categories, so a report cannot be submitted yet." /> : <form className="surface-card mx-auto max-w-3xl space-y-5" onSubmit={handleSubmit}>
      {error && <ErrorState message={error} />}
      <div><label className="field-label" htmlFor="category">Waste category</label><select className="field-input" id="category" name="category" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></div>
      <div><label className="field-label" htmlFor="description">What did you see?</label><textarea className="field-input min-h-28" id="description" name="description" minLength={10} maxLength={500} required placeholder="Describe the waste and nearby landmark…" /><p className="field-help">10–500 characters. Avoid including private personal information.</p></div>
      <div className="rounded-2xl bg-emerald-50 p-4"><div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-800" aria-hidden="true" /><div><h2 className="font-semibold text-emerald-950">Location coordinates</h2><p className="mt-1 text-sm leading-6 text-slate-600">Enter coordinates for the report location. Latitude: −90 to 90; longitude: −180 to 180.</p></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="field-label" htmlFor="latitude">Latitude</label><input className="field-input" id="latitude" name="latitude" type="number" min="-90" max="90" step="any" required /></div><div><label className="field-label" htmlFor="longitude">Longitude</label><input className="field-input" id="longitude" name="longitude" type="number" min="-180" max="180" step="any" required /></div></div></div>
      <div><label className="field-label" htmlFor="photo">Photo (optional)</label><input className="field-input file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-900" id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><p className="field-help">JPEG, PNG, or WEBP up to 5 MB; the API validates uploads.</p></div>
      <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit for review'} <Send size={16} aria-hidden="true" /></button>
    </form>}
  </div>;
}