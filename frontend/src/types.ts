export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

export interface Guidance {
  title: string;
  body: string;
  updated_at: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon_url: string;
  guidance: Guidance | null;
}

export interface Prediction {
  id: number;
  predicted_label: string;
  confidence: number;
  is_uncertain: boolean;
  top3: Array<{ label: string; score: number }>;
  guidance_url: string | null;
  image_url: string | null;
  created_at: string;
}

export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export interface WasteReport {
  id: number;
  user: { id: number; username: string };
  category: { id: number; slug: string; name: string };
  description: string;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  reviewed_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}