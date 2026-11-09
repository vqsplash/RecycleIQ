import { api } from './client';
import type { Category, Paginated, Prediction, WasteReport } from '../types';

export const getCategories = () => api.get<Category[]>('/guidance/');

export function classifyImage(file: File) {
  const body = new FormData();
  body.append('image', file);
  return api.post<Prediction>('/classify/', body);
}

export function getReports(params: URLSearchParams = new URLSearchParams()) {
  const query = params.toString();
  return api.get<Paginated<WasteReport>>(`/reports/${query ? `?${query}` : ''}`);
}

export function submitReport(input: {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: File;
}) {
  const body = new FormData();
  body.set('category', input.category);
  body.set('description', input.description);
  body.set('latitude', String(input.latitude));
  body.set('longitude', String(input.longitude));
  if (input.photo) body.set('photo', input.photo);
  return api.post<WasteReport>('/reports/', body);
}

export function getAdminReports(page = 1) {
  return api.get<Paginated<WasteReport>>(`/admin/reports/?page=${page}&page_size=100`);
}

export function setReportStatus(id: number, status: string) {
  return api.patch<WasteReport>(`/admin/reports/${id}/`, { status });
}

export function updateGuidance(slug: string, title: string, body: string) {
  return api.put<Category>(`/guidance/${slug}/`, { title, body });
}