import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl">{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>}<h1 className="text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">{title}</h1><p className="mt-3 leading-7 text-slate-600">{description}</p></div>{action}</div>;
}