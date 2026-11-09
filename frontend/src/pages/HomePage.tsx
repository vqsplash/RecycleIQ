import { ArrowDownRight, ArrowRight, Camera, MapPinned, Recycle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: Camera, title: 'Identify an item', body: 'Upload a waste photo and see the model response, when the classification service is available.' },
  { icon: Recycle, title: 'Find guidance', body: 'Browse category-specific disposal information maintained by the RecycleIQ team.' },
  { icon: MapPinned, title: 'Report a location', body: 'Share a geotagged waste concern for review by an administrator.' },
];

export function HomePage() {
  return <div className="space-y-16 sm:space-y-20">
    <section className="relative overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16 lg:py-20">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[36px] border-emerald-800/50" aria-hidden="true" />
      <div className="absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-lime-400/10 blur-2xl" aria-hidden="true" />
      <div className="relative max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-100"><ShieldCheck size={14} aria-hidden="true" /> Community-powered waste awareness</p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">A clearer path from waste to <span className="text-lime-300">better choices.</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-100/85 sm:text-lg">RecycleIQ brings waste identification, practical recycling guidance, and community reporting together in one place.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link className="btn-lime" to="/classify">Classify an item <ArrowRight size={17} aria-hidden="true" /></Link><Link className="btn-on-dark" to="/guidance">Explore guidance <ArrowDownRight size={17} aria-hidden="true" /></Link></div>
      </div>
    </section>

    <section aria-labelledby="how-it-helps">
      <div className="mb-7 max-w-2xl"><p className="section-eyebrow">A useful place to start</p><h2 id="how-it-helps" className="section-title">Small actions, shared impact.</h2><p className="mt-3 leading-7 text-slate-600">Use the tools that fit the moment. Classification is a model estimate; community reports are reviewed before appearing publicly.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, title, body }, index) => <article key={title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon aria-hidden="true" /></span><p className="mt-6 text-xs font-bold uppercase tracking-widest text-emerald-700">0{index + 1}</p><h3 className="mt-2 text-xl font-semibold text-emerald-950">{title}</h3><p className="mt-2 leading-6 text-slate-600">{body}</p></article>)}</div>
    </section>

    <section className="grid gap-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9"><div><p className="section-eyebrow">See what the community has shared</p><h2 className="mt-2 text-2xl font-semibold text-emerald-950">Only approved reports appear on the map.</h2><p className="mt-2 max-w-2xl leading-6 text-slate-600">Every new submission starts pending and stays private until it has been reviewed.</p></div><Link className="btn-primary w-fit" to="/map">Open community map <ArrowRight size={16} aria-hidden="true" /></Link></section>
  </div>;
}