# RecycleIQ — System Architecture

> Version 1.0 · November 2026

---

## 1. High-Level Architecture

RecycleIQ uses a classic three-tier web architecture with an embedded ML inference layer:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  React 18 + Vite (TypeScript)                                   │
│  Tailwind CSS  │  React Leaflet  │  Recharts  │  Axios          │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTPS  (JSON / multipart)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DJANGO REST API                             │
│  Django 5 + DRF  │  SimpleJWT  │  django-filter  │  Pillow      │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ accounts   │  │classific.  │  │  guidance  │  │  reports  │ │
│  │ /auth/*    │  │/classify/* │  │/guidance/* │  │/reports/* │ │
│  └────────────┘  └─────┬──────┘  └────────────┘  └───────────┘ │
│                        │                                        │
│                  ┌─────▼──────────────────────────────────┐    │
│                  │          ML Inference Layer             │    │
│                  │  ml/inference.py                        │    │
│                  │  MobileNetV2 (H5 / SavedModel)          │    │
│                  │  Loaded once at app startup             │    │
│                  └────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────┐                                                  │
│  │ analytics  │                                                  │
│  │/analytics/*│                                                  │
│  └────────────┘                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │  ORM (psycopg2 / sqlite3)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                            │
│  PostgreSQL 15 (production) / SQLite (local dev)                │
│                                                                 │
│  Tables: auth_user, wastecategory, guidanceentry,               │
│          prediction, predictioncorrection, wastereport          │
└─────────────────────────────────────────────────────────────────┘

                            ▲ (media files)
┌───────────────────────────┴─────────────────────────────────────┐
│                       FILE STORAGE                              │
│  Local MEDIA_ROOT (development)                                 │
│  S3-compatible object store (production, optional)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend (React / Vite)

| Component Group | Key Files | Responsibility |
|---|---|---|
| Pages | `ClassifyPage`, `MapPage`, `ReportFormPage`, `AdminDashboard` | Route-level views |
| API Layer | `axiosClient.ts`, `classificationApi.ts`, `reportsApi.ts` | Typed HTTP calls to backend |
| State | `authStore.ts`, `classificationStore.ts` (Zustand) | JWT token management, last prediction |
| Map | `MapView.tsx`, `MapMarker.tsx` (React Leaflet) | Render approved reports on OSM tiles |
| Charts | `CategoryPieChart`, `ReportStatusBar`, `ReportTimelineChart` (Recharts) | Analytics visualisations |
| Auth Guard | `ProtectedRoute.tsx` | Redirect unauthenticated users |

### 2.2 Backend (Django / DRF)

| App | Models | Key Views |
|---|---|---|
| `accounts` | `CustomUser` | `RegisterView`, `TokenObtainView`, `TokenRefreshView` |
| `classification` | `Prediction`, `PredictionCorrection` | `ClassifyView` (multipart POST), `CorrectView` |
| `guidance` | `WasteCategory`, `GuidanceEntry` | `CategoryListView`, `GuidanceDetailView`, admin CRUD |
| `reports` | `WasteReport` | `ReportListCreateView`, `ReportDetailView` |
| `analytics` | — (aggregation queries only) | `SummaryView`, `TimelineView` |

### 2.3 ML Inference Layer

```
Image (bytes)
    │
    ▼
preprocess.py
  • PIL.Image.open → RGB
  • Resize to 224×224
  • tf.keras.applications.mobilenet_v2.preprocess_input
    │
    ▼
inference.py
  • model.predict(np.expand_dims(arr, axis=0))
  • argmax → label; max → confidence
  • Build top-3 list
    │
    ▼
JSON response: { label, confidence, top3, uncertain }
```

The model file (`mobilenetv2_waste.h5`) is loaded once inside `ClassificationConfig.ready()` and held in a module-level global for the lifetime of the process.

---

## 3. Detailed Data Flow — Waste Classification

```
User selects image file
        │
        ▼ (multipart/form-data)
POST /api/classify/
        │
        ▼
ClassifyView.post()
  ├─ Validate file (type: JPEG/PNG/WEBP, size ≤ 5 MB)
  ├─ Save image to MEDIA_ROOT/predictions/<uuid>.<ext>
  ├─ Call inference.predict(image_path)
  │       ├─ Preprocess → tensor
  │       └─ model.predict → {label, confidence, top3}
  ├─ Create Prediction record in DB
  └─ Return PredictionSerializer response
        │
        ▼ (JSON 200)
ClassifyPage receives:
  { id, label, confidence, uncertain, top3, guidance_url }
        │
        ├─ confidence ≥ 0.60 → show result + link to GuidancePage
        └─ confidence < 0.60 → show UncertaintyBanner + best guess
```

---

## 4. Detailed Data Flow — Community Report

```
User fills ReportFormPage
  (category, description, photo, lat/lng via map click)
        │
        ▼ (multipart/form-data)
POST /api/reports/
        │
        ▼
ReportListCreateView.create()
  ├─ Authenticate user (JWT)
  ├─ Validate fields
  ├─ Save photo to MEDIA_ROOT/reports/<uuid>.<ext>
  ├─ Set status = 'pending'
  └─ Create WasteReport record
        │
        ▼ (JSON 201)
        │
        ◄── Admin reviews in AdminReports page ──►
        │
PATCH /api/admin/reports/{id}/
  ├─ Set status ∈ {approved, rejected, resolved}
  └─ Record reviewed_by + updated_at
        │
        ▼
Approved reports appear on MapPage
GET /api/reports/?status=approved&category=plastic
```

---

## 5. Authentication & Authorization

| Role | Capability |
|---|---|
| Anonymous | View map (approved reports only), view guidance, view home/help |
| Authenticated User | All anonymous + upload image to classify, submit report, correct prediction |
| Admin (`is_staff=True`) | All user + moderate reports, CRUD guidance, view analytics |

**Flow:**
1. `POST /api/auth/token/` → `{ access, refresh }` stored in `localStorage`.
2. Axios interceptor injects `Authorization: Bearer <access>` on every request.
3. If 401 received, attempt `POST /api/auth/token/refresh/`; on failure, redirect to login.
4. Admin routes guarded server-side by `IsAdminUser` DRF permission class and client-side by `ProtectedRoute` checking `user.is_staff`.

---

## 6. Database Schema (Detailed)

### `accounts_customuser`
Extends Django's `AbstractUser`. No extra columns needed for MVP; `is_staff` controls admin access.

### `guidance_wastecategory`
```sql
id          SERIAL PRIMARY KEY
slug        VARCHAR(50) UNIQUE NOT NULL   -- e.g. 'plastic'
name        VARCHAR(100) NOT NULL
icon_url    VARCHAR(255)
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### `guidance_guidanceentry`
```sql
id           SERIAL PRIMARY KEY
category_id  INTEGER REFERENCES guidance_wastecategory(id)
title        VARCHAR(200) NOT NULL
body         TEXT NOT NULL               -- Markdown or plain text
updated_at   TIMESTAMPTZ DEFAULT NOW()
updated_by   INTEGER REFERENCES auth_user(id)
```

### `classification_prediction`
```sql
id               SERIAL PRIMARY KEY
user_id          INTEGER REFERENCES auth_user(id) NULL  -- nullable (anonymous allowed)
image            VARCHAR(255) NOT NULL               -- relative path in MEDIA_ROOT
predicted_label  VARCHAR(50) NOT NULL
confidence       FLOAT NOT NULL
is_uncertain     BOOLEAN NOT NULL DEFAULT FALSE
top3_json        JSONB                               -- [{label, score}, ...]
category_id      INTEGER REFERENCES guidance_wastecategory(id) NULL
created_at       TIMESTAMPTZ DEFAULT NOW()
```

### `classification_predictioncorrection`
```sql
id              SERIAL PRIMARY KEY
prediction_id   INTEGER REFERENCES classification_prediction(id)
user_id         INTEGER REFERENCES auth_user(id)
correct_label   VARCHAR(50) NOT NULL
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### `reports_wastereport`
```sql
id           SERIAL PRIMARY KEY
user_id      INTEGER REFERENCES auth_user(id)
category_id  INTEGER REFERENCES guidance_wastecategory(id)
description  VARCHAR(500) NOT NULL
photo        VARCHAR(255)                          -- optional
latitude     FLOAT NOT NULL
longitude    FLOAT NOT NULL
status       VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected','resolved'))
created_at   TIMESTAMPTZ DEFAULT NOW()
updated_at   TIMESTAMPTZ DEFAULT NOW()
reviewed_by  INTEGER REFERENCES auth_user(id) NULL
```

---

## 7. API Gateway / CORS

- During development: Vite dev server proxies `/api/*` to `http://localhost:8000`.
- In production: Nginx (or hosting platform) reverse-proxies frontend + API under same origin, eliminating CORS complexity. If deployed separately, `django-cors-headers` whitelist the frontend domain.

---

## 8. Deployment Architecture (Target)

```
                 ┌───────────────────────┐
Internet ───────►│  Frontend (Vercel /   │
                 │  Netlify)             │
                 │  React SPA (CDN)      │
                 └──────────┬────────────┘
                            │  HTTPS API calls
                 ┌──────────▼────────────┐
                 │  Backend (Render /    │
                 │  Railway)             │
                 │  Gunicorn + Django    │
                 └──────────┬────────────┘
                            │  psycopg2
                 ┌──────────▼────────────┐
                 │  PostgreSQL           │
                 │  (Render DB /         │
                 │   Supabase free tier) │
                 └───────────────────────┘
```

Media files are served from `MEDIA_ROOT` during development; production can use an S3-compatible store (e.g., Cloudflare R2 free tier).

---

## 9. Security Considerations

| Concern | Mitigation |
|---|---|
| File upload abuse | Validate MIME type server-side with `python-magic`; limit to 5 MB; store outside web root |
| JWT theft | Short access token TTL (15 min); refresh token (7 days) in `httpOnly` cookie where possible |
| SQL injection | Django ORM parameterised queries only; no raw SQL |
| Admin access | `IsAdminUser` permission on all admin endpoints; `is_staff` set only via Django admin superuser |
| Confidence misrepresentation | Always display confidence score; uncertain flag surfaced to user |

---

## 10. Non-Functional Targets

| Metric | Target |
|---|---|
| Classification response time | < 3 s (CPU inference, single image) |
| Map initial load | < 2 s for ≤ 500 markers |
| Mobile layout | Functional at 375 px viewport width |
| Test coverage | ≥ 60 % backend line coverage (pytest-cov) |
| Model accuracy | ≥ 70 % on held-out test set (target, not guaranteed) |

