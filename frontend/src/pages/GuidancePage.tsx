import { useEffect, useState } from 'react';
import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getCategories } from '../api/recycleiq';
import { ApiError } from '../api/client';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import type { Category } from '../types';

export function GuidancePage() {
  const { slug } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try { setCategories(await getCategories()); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Could not load guidance from the API.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const selected = slug ? categories.find((category) => category.slug === slug) : null;
  const listed = slug ? (selected ? [selected] : []) : categories;

  return <div>
    <PageHeader eyebrow="Recycling guidance" title={selected?.name ?? (slug ? 'Category guidance' : 'Guidance library')} description="Disposal guidance is served by the RecycleIQ API and maintained by administrators. If no entry is available, we’ll say so rather than guess." action={slug ? <Link to="/guidance" className="btn-secondary">All categories</Link> : undefined} />
    {loading ? <LoadingState label="Loading guidance from the API…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : slug && !selected ? <EmptyState title="Category not found" body="That category is not present in the guidance API response." /> : listed.length === 0 ? <EmptyState title="No categories available yet" body="The guidance API returned no categories. Check back after the project data has been added." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{listed.map((category) => <article key={category.id} className="surface-card flex flex-col">
      <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><BookOpenCheck aria-hidden="true" /></span><div><h2 className="text-xl font-semibold text-emerald-950">{category.name}</h2><p className="mt-1 text-sm text-slate-500">{category.slug}</p></div></div>
      {category.guidance ? <div className="mt-5 flex-1"><h3 className="font-semibold text-slate-900">{category.guidance.title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{category.guidance.body}</p><p className="mt-4 text-xs text-slate-500">Updated {new Date(category.guidance.updated_at).toLocaleDateString()}</p></div> : <div className="mt-5 flex-1 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-slate-600">No guidance entry has been published for this category yet.</div>}
      {!slug && <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950" to={`/guidance/${category.slug}`}>Open category <ArrowRight size={15} aria-hidden="true" /></Link>}
    </article>)}</div>}
  </div>;
}