import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { MapPin, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { ApiError } from '../api/client';
import { getCategories, getReports } from '../api/recycleiq';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import type { Category, WasteReport } from '../types';

export function MapPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getCategories().then(setCategories).catch((reason: unknown) => setCategoryError(reason instanceof ApiError ? reason.message : 'Could not load category filters.')); }, []);
  useEffect(() => { void loadReports(); }, [category, page]);

  async function loadReports() {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ status: 'approved', page: String(page), page_size: '100' });
    if (category) params.set('category', category);
    try {
      const response = await getReports(params);
      setReports(response.results);
      setCount(response.count);
      setHasNext(Boolean(response.next));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not load community reports.');
    } finally { setLoading(false); }
  }

  return <div>
    <PageHeader eyebrow="Community map" title="See reviewed reports" description="This map requests approved reports only. New submissions are private while pending and appear here only after admin review." action={<button className="btn-secondary" onClick={() => void loadReports()} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</button>} />
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between"><div><label htmlFor="map-category" className="field-label">Filter by category</label><select id="map-category" className="field-input min-w-56" value={category} onChange={(event) => { setPage(1); setCategory(event.target.value); }}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>{categoryError && <p className="mt-2 text-xs text-amber-800" role="status">{categoryError}</p>}</div><p className="text-sm text-slate-600">{count} approved report{count === 1 ? '' : 's'} available from the API</p></div>
    {error ? <ErrorState message={error} onRetry={() => void loadReports()} /> : loading ? <LoadingState label="Loading approved reports…" /> : reports.length === 0 ? <EmptyState title="No approved reports to show" body="No reports matched this filter in the API response. Pending and rejected reports are not displayed on the public map." /> : <>
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"><MapContainer center={[23.8103, 90.4125]} zoom={11} scrollWheelZoom className="h-[55vh] min-h-[380px] w-full sm:h-[620px]" aria-label="Map of approved community waste reports"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{reports.map((report) => <CircleMarker key={report.id} center={[report.latitude, report.longitude]} radius={9} pathOptions={{ color: '#065f46', fillColor: '#34d399', fillOpacity: 0.9 }}><Popup><div className="max-w-56"><strong>{report.category.name}</strong><p className="mt-1">{report.description}</p><small>Approved report · {new Date(report.created_at).toLocaleDateString()}</small></div></Popup></CircleMarker>)}</MapContainer></div>
      <div className="mt-5 flex items-center justify-between"><span className="inline-flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} aria-hidden="true" /> Showing {reports.length} reports on this page</span><div className="flex gap-2"><button className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="btn-secondary" disabled={!hasNext || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
    </>}
  </div>;
}