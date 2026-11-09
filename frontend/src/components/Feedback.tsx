import { AlertCircle, LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-3 py-12 text-emerald-800" role="status" aria-live="polite"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div className="flex-1"><p>{message}</p>{onRetry && <button className="mt-2 text-sm font-semibold underline" onClick={onRetry}>Try again</button>}</div></div>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center"><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>;
}