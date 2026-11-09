import { useEffect, useState, type FormEvent } from 'react';
import { Check, ClipboardList, RefreshCw, Save } from 'lucide-react';
import { ApiError } from '../api/client';
import { getAdminReports, getCategories, setReportStatus, updateGuidance } from '../api/recycleiq';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import type { Category, ReportStatus, WasteReport } from '../types';

const nextStatuses: Record<ReportStatus, ReportStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['resolved'],
  rejected: [],
  resolved: [],
};

export function AdminPage() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingReport, setSavingReport] = useState<number | null>(null);
  const [savingGuidance, setSavingGuidance] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [reportPage, categoryList] = await Promise.all([getAdminReports(), getCategories()]);
      setReports(reportPage.results);
      setCategories(categoryList);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not load admin data from the API.');
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function reviewReport(id: number, status: ReportStatus) {
    setSavingReport(id);
    setError('');
    setNotice('');
    try {
      const updated = await setReportStatus(id, status);
      setReports((items) => items.map((item) => item.id === id ? updated : item));
      setNotice(`Report #${id} updated to ${updated.status}.`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not update report status.');
    } finally { setSavingReport(null); }
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>, category: Category) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSavingGuidance(category.slug);
    setError('');
    setNotice('');
    try {
      await updateGuidance(category.slug, String(data.get('title')), String(data.get('body')));
      setNotice(`${category.name} guidance saved.`);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not save guidance.');
    } finally { setSavingGuidance(null); }
  }

  return <div>
    <PageHeader eyebrow="Administration" title="Admin dashboard" description="Review community submissions and maintain category guidance. Changes are saved through the protected Django API." action={<button className="btn-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh data</button>} />
    {error && <div className="mb-5"><ErrorState message={error} onRetry={() => void load()} /></div>}
    {notice && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{notice}</p>}
    {loading ? <LoadingState label="Loading reports and guidance…" /> : <div className="space-y-12">
      <section aria-labelledby="moderation-heading"><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><ClipboardList size={19} aria-hidden="true" /></span><div><h2 id="moderation-heading" className="text-xl font-semibold text-emerald-950">Report moderation</h2><p className="text-sm text-slate-600">{reports.length} reports returned by the admin API.</p></div></div>
        {reports.length === 0 ? <EmptyState title="No reports returned" body="There are no reports in the current API response to review." /> : <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Report</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Submitted by</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review action</th></tr></thead><tbody className="divide-y divide-stone-100">{reports.map((report) => <tr key={report.id} className="align-top"><td className="px-4 py-4"><strong className="text-slate-900">#{report.id}</strong><p className="mt-1 max-w-xs leading-5 text-slate-600">{report.description}</p><p className="mt-1 text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</p></td><td className="px-4 py-4">{report.category.name}</td><td className="px-4 py-4">{report.user.username}</td><td className="px-4 py-4"><span className={`status-pill status-${report.status}`}>{report.status}</span></td><td className="px-4 py-4">{nextStatuses[report.status].length ? <div className="flex flex-wrap gap-2">{nextStatuses[report.status].map((status) => <button key={status} className={status === 'rejected' ? 'btn-danger' : 'btn-secondary'} disabled={savingReport === report.id} onClick={() => void reviewReport(report.id, status)}>{savingReport === report.id ? 'Saving…' : `${status[0].toUpperCase()}${status.slice(1)}`}</button>)}</div> : <span className="text-slate-400">No further transition</span>}</td></tr>)}</tbody></table></div></div>}
      </section>

      <section aria-labelledby="guidance-heading"><div className="mb-5"><h2 id="guidance-heading" className="text-xl font-semibold text-emerald-950">Recycling guidance</h2><p className="mt-1 text-sm text-slate-600">Only guidance returned by the API is shown. Saving updates uses the admin-only category endpoint.</p></div>
        {categories.length === 0 ? <EmptyState title="No categories available" body="No guidance categories were returned by the API." /> : <div className="grid gap-4 lg:grid-cols-2">{categories.map((category) => <form key={category.slug} className="surface-card space-y-4" onSubmit={(event) => void saveEntry(event, category)}><div><h3 className="font-semibold text-emerald-950">{category.name}</h3><p className="text-xs text-slate-500">{category.slug}</p></div><div><label className="field-label" htmlFor={`title-${category.slug}`}>Guidance title</label><input className="field-input" id={`title-${category.slug}`} name="title" maxLength={200} required defaultValue={category.guidance?.title ?? ''} /></div><div><label className="field-label" htmlFor={`body-${category.slug}`}>Guidance text</label><textarea className="field-input min-h-32" id={`body-${category.slug}`} name="body" required defaultValue={category.guidance?.body ?? ''} /></div><button className="btn-primary" type="submit" disabled={savingGuidance === category.slug}>{savingGuidance === category.slug ? 'Saving…' : 'Save guidance'}{savingGuidance === category.slug ? null : <Save size={15} aria-hidden="true" />}</button>{category.guidance && <span className="ml-3 text-xs text-slate-500"><Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Updated {new Date(category.guidance.updated_at).toLocaleDateString()}</span>}</form>)}</div>}
      </section>
    </div>}
  </div>;
}