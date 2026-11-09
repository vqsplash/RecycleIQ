import { useState, type FormEvent } from 'react';
import { ArrowRight, ImagePlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { classifyImage } from '../api/recycleiq';
import { ApiError } from '../api/client';
import { ErrorState, LoadingState } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import type { Prediction } from '../types';

export function ClassifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setError('');
    setPrediction(null);
    setLoading(true);
    try {
      setPrediction(await classifyImage(file));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not reach the classification service. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return <div>
    <PageHeader eyebrow="Image classification" title="Classify waste" description="Choose a clear photo of one item. The result is a model estimate, not a guarantee—check the category guidance before disposal." />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
      <form className="surface-card space-y-5" onSubmit={handleSubmit}>
        <div><label htmlFor="waste-image" className="field-label">Waste item photo</label><p className="field-help" id="image-help">JPEG, PNG, or WEBP. Maximum file size: 5 MB.</p>
          <label htmlFor="waste-image" className="mt-3 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-600">
            <ImagePlus className="h-9 w-9 text-emerald-700" aria-hidden="true" /><span className="mt-3 font-semibold text-emerald-950">{file?.name ?? 'Choose an image to upload'}</span><span className="mt-1 text-sm text-slate-600">Select a photo from your device</span>
            <input id="waste-image" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="image-help" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPrediction(null); setError(''); }} />
          </label>
        </div>
        {error && <ErrorState message={error} />}
        <button className="btn-primary w-full sm:w-auto" type="submit" disabled={!file || loading}>{loading ? 'Checking image…' : 'Get classification'} <Sparkles size={16} aria-hidden="true" /></button>
        <p className="text-xs leading-5 text-slate-500">Upload validation and model availability are checked by the API. Your image is not classified in the browser.</p>
      </form>
      <section aria-live="polite" aria-label="Classification result" className="surface-card min-h-72">
        {loading ? <LoadingState label="Submitting image to RecycleIQ…" /> : prediction ? <div>
          {prediction.is_uncertain && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status"><strong>Uncertain result.</strong> Treat this as a possible match and check reliable local guidance.</div>}
          <p className="section-eyebrow">Model response</p><h2 className="mt-2 text-2xl font-semibold capitalize text-emerald-950">{prediction.predicted_label.replace(/_/g, ' ')}</h2><p className="mt-2 text-slate-600">Confidence: <strong>{Math.round(prediction.confidence * 100)}%</strong></p>
          <div className="mt-6"><h3 className="text-sm font-semibold text-slate-800">Top model suggestions</h3><ul className="mt-3 space-y-3">{prediction.top3.map((item) => <li key={item.label} className="flex items-center justify-between gap-4 text-sm"><span className="capitalize">{item.label.replace(/_/g, ' ')}</span><span className="font-medium text-emerald-800">{Math.round(item.score * 100)}%</span></li>)}</ul></div>
          <Link className="btn-secondary mt-6" to={`/guidance/${encodeURIComponent(prediction.predicted_label)}`}>Read category guidance <ArrowRight size={15} aria-hidden="true" /></Link>
        </div> : <div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Sparkles aria-hidden="true" /></span><h2 className="mt-4 font-semibold text-emerald-950">Your result will appear here</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">The classification service provides results when a model is available. If it is offline, we’ll show the API error instead.</p></div>}
      </section>
    </div>
  </div>;
}