# RecycleIQ — Implementation Plan

> **University Project** · Bangladesh University of Business and Technology (BUBT)  
> **Submission Date:** 17 October 2026 · **Team:** 5 developers · **Duration:** 8 weeks

---

## 1. Executive Summary

RecycleIQ is an AI-powered web application that lets users upload a waste-item photo and receive a predicted category (cardboard, paper, glass, metal, plastic, or organic waste) with a confidence score and admin-curated disposal guidance. It also hosts a community reporting system where users can submit geotagged waste accumulation reports that are displayed on an interactive map and moderated by an administrator.

This document covers the full implementation plan, folder structure, and eight-week development schedule.

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Fast HMR, component model, type safety |
| Styling | Tailwind CSS | Utility-first, responsive out-of-the-box |
| Maps | React Leaflet + OpenStreetMap tiles | Free, no API key required for core use |
| Charts | Recharts | Declarative, React-native charting |
| Backend | Python 3.11 + Django 5 + Django REST Framework | Mature, batteries-included |
| Auth | `djangorestframework-simplejwt` | Stateless JWT, easy to integrate |
| AI/ML | TensorFlow 2.x / Keras + MobileNetV2 | Lightweight transfer-learning backbone |
| Database | PostgreSQL 15 (SQLite during local dev) | ACID, JSON fields, production-ready |
| File Storage | Django `MEDIA_ROOT` / S3-compatible (optional) | Simple; upgradeable |
| Dev Tools | Git, GitHub, ESLint, Black, pytest | Standard open-source tooling |

---

## 3. Folder Structure

```
RecycleIQ/
├── docs/                          # Project documentation
│   ├── IMPLEMENTATION_PLAN.md
│   ├── ARCHITECTURE.md
│   └── API_SPEC.md
│
├── backend/                       # Django project root
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── recycleiq/                 # Django project package
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── local.py           # SQLite + DEBUG
│   │   │   └── production.py      # PostgreSQL
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── apps/
│   │   ├── accounts/              # User & admin auth
│   │   │   ├── models.py          # CustomUser (extends AbstractUser)
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── classification/        # AI inference endpoint
│   │   │   ├── models.py          # Prediction, PredictionCorrection
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── guidance/              # Admin-maintained disposal guidance
│   │   │   ├── models.py          # WasteCategory, GuidanceEntry
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── reports/               # Community waste reports
│   │   │   ├── models.py          # WasteReport
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── filters.py
│   │   │   └── urls.py
│   │   │
│   │   └── analytics/             # Admin summary statistics
│   │       ├── views.py
│   │       └── urls.py
│   │
│   └── ml/                        # ML model files & inference
│       ├── model/
│       │   └── mobilenetv2_waste.h5   # trained weights (not in git)
│       ├── inference.py               # load model, predict, return label+score
│       ├── preprocess.py              # resize, normalize for MobileNetV2
│       ├── train.py                   # transfer-learning training script
│       ├── evaluate.py                # confusion matrix, classification report
│       └── datasets/                  # (gitignored) raw & processed images
│
├── frontend/                      # Vite + React application
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── router.tsx             # React Router v6 route table
│       │
│       ├── api/                   # Axios client + typed request helpers
│       │   ├── axiosClient.ts
│       │   ├── classificationApi.ts
│       │   ├── guidanceApi.ts
│       │   ├── reportsApi.ts
│       │   └── analyticsApi.ts
│       │
│       ├── components/            # Reusable UI atoms & molecules
│       │   ├── Navbar.tsx
│       │   ├── Footer.tsx
│       │   ├── ImageUploader.tsx
│       │   ├── ConfidenceBadge.tsx
│       │   ├── UncertaintyBanner.tsx
│       │   ├── GuidanceCard.tsx
│       │   ├── ReportCard.tsx
│       │   ├── MapView.tsx
│       │   ├── MapMarker.tsx
│       │   ├── FilterBar.tsx
│       │   └── charts/
│       │       ├── CategoryPieChart.tsx
│       │       ├── ReportStatusBar.tsx
│       │       └── ReportTimelineChart.tsx
│       │
│       ├── pages/                 # Route-level page components
│       │   ├── HomePage.tsx
│       │   ├── ClassifyPage.tsx
│       │   ├── GuidancePage.tsx
│       │   ├── ReportFormPage.tsx
│       │   ├── MapPage.tsx
│       │   ├── HelpPage.tsx
│       │   └── admin/
│       │       ├── AdminDashboard.tsx
│       │       ├── AdminReports.tsx
│       │       ├── AdminGuidance.tsx
│       │       └── AdminAnalytics.tsx
│       │
│       ├── store/                 # Zustand or React Context state
│       │   ├── authStore.ts
│       │   └── classificationStore.ts
│       │
│       ├── hooks/                 # Custom React hooks
│       │   ├── useClassify.ts
│       │   ├── useReports.ts
│       │   └── useAuth.ts
│       │
│       └── types/                 # Shared TypeScript interfaces
│           ├── classification.ts
│           ├── guidance.ts
│           ├── report.ts
│           └── analytics.ts
│
└── .github/
    └── workflows/
        └── ci.yml                 # Lint + test on push
```

---

## 4. Database Entity–Relationship Diagram

```
┌──────────────────┐          ┌────────────────────┐
│   CustomUser     │          │   WasteCategory    │
│──────────────────│          │────────────────────│
│ id (PK)          │          │ id (PK)            │
│ username         │          │ slug               │
│ email            │          │ name               │
│ is_staff         │          │ icon_url           │
│ is_active        │          │ created_at         │
│ date_joined      │          └─────────┬──────────┘
└───────┬──────────┘                    │ 1
        │ 1                             │
        │ creates                       │ has many
        │                     ┌─────────▼──────────┐
        │             ┌───────┤   GuidanceEntry    │
        │             │       │────────────────────│
        │             │       │ id (PK)            │
        │             │       │ category_id (FK)   │
        │             │       │ title              │
        │             │       │ body (rich text)   │
        │             │       │ updated_at         │
        │             │       │ updated_by (FK→User│
        │             │       └────────────────────┘
        │
        │ submits many
        │
┌───────▼──────────┐          ┌────────────────────┐
│   WasteReport    │◄─────────┤   Prediction       │
│──────────────────│ linked   │────────────────────│
│ id (PK)          │          │ id (PK)            │
│ user_id (FK)     │          │ user_id (FK)       │
│ category_id (FK) │          │ image              │
│ description      │          │ predicted_label    │
│ photo            │          │ confidence         │
│ latitude         │          │ category_id (FK)   │
│ longitude        │          │ created_at         │
│ status           │          └──────────┬─────────┘
│   pending        │                     │ 1
│   approved       │          ┌──────────▼─────────┐
│   rejected       │          │PredictionCorrection│
│   resolved       │          │────────────────────│
│ created_at       │          │ id (PK)            │
│ updated_at       │          │ prediction_id (FK) │
│ reviewed_by(FK)  │          │ user_id (FK)       │
└──────────────────┘          │ correct_label      │
                              │ created_at         │
                              └────────────────────┘
```

**Status transition:**  
`pending` → `approved` → `resolved`  
`pending` → `rejected`

---

## 5. Waste Categories (In-Scope)

| Slug | Display Name | Dataset Source |
|---|---|---|
| `cardboard` | Cardboard | TrashNet / Garbage dataset |
| `paper` | Paper | TrashNet / Garbage dataset |
| `glass` | Glass | TrashNet / Garbage dataset |
| `metal` | Metal | TrashNet / Garbage dataset |
| `plastic` | Plastic | TrashNet / Garbage dataset |
| `organic` | Organic Waste | TrashNet / Garbage dataset |

---

## 6. AI / ML Pipeline

### 6.1 Dataset
- Primary: **TrashNet** (~2,500 images, 6 classes) or Kaggle Garbage Classification dataset.
- Split: 70 % train / 15 % validation / 15 % test (held-out, never used for training or tuning).
- Augmentation: horizontal flip, ±20° rotation, zoom 0.8–1.2×, brightness jitter.

### 6.2 Model Architecture
```
MobileNetV2 (ImageNet weights, frozen)
  └─ GlobalAveragePooling2D
       └─ Dropout(0.3)
            └─ Dense(128, relu)
                 └─ Dropout(0.2)
                      └─ Dense(6, softmax)
```

### 6.3 Training Strategy
1. **Phase 1 (5 epochs):** Train only new head layers; MobileNetV2 frozen.
2. **Phase 2 (15 epochs):** Unfreeze top 30 layers; fine-tune with LR = 1e-5.
- Input: 224 × 224 × 3 (MobileNetV2 standard).
- Loss: categorical crossentropy; optimizer: Adam.

### 6.4 Confidence Threshold
- If `max(softmax) < 0.60` → system returns `uncertain` state; frontend shows `UncertaintyBanner`.

### 6.5 Evaluation
- Metrics: accuracy, per-class precision / recall / F1, confusion matrix.
- Documented in `ml/evaluate.py`; results stored in `docs/MODEL_EVALUATION.md`.

### 6.6 Inference API
- Model loaded once at Django startup into memory (`apps.ready()`).
- Accepts uploaded image; returns `{label, confidence, top3: [{label, score}]}`.

---

## 7. Eight-Week Development Plan

### Week 1 — Project Setup & Architecture
**Goal:** Working skeleton; every team member can run the app locally.

| Task | Owner(s) | Days |
|---|---|---|
| Finalise repo structure, branch strategy, CI skeleton | QA Lead | 1 |
| Django project init: settings, apps, Postgres/SQLite config | Backend Lead | 2 |
| Vite + React + Tailwind scaffold; router; placeholder pages | Frontend Lead | 2 |
| Database models + initial migrations (all apps) | Backend Lead | 2 |
| `CustomUser`, JWT auth endpoints (register, login, refresh) | Backend Lead | 2 |
| Login/Register UI + `authStore` | Frontend Lead | 2 |
| Dataset download & folder structure for ML | AI/ML Lead | 2 |

**Milestone:** `GET /api/health/` returns 200; login flow works end-to-end.

---

### Week 2 — AI Model & Classification Endpoint
**Goal:** Upload an image and get a prediction back.

| Task | Owner(s) | Days |
|---|---|---|
| Data preprocessing pipeline (`preprocess.py`) | AI/ML Lead | 1 |
| Phase 1 training (frozen backbone) | AI/ML Lead | 2 |
| `inference.py`: load model, run prediction, return JSON | AI/ML Lead | 1 |
| `POST /api/classify/` endpoint + `Prediction` model | Backend Lead | 2 |
| `ImageUploader` component with file validation | Frontend Lead | 2 |
| `ClassifyPage` — upload → spinner → result display | Frontend Lead | 2 |
| `ConfidenceBadge` + `UncertaintyBanner` components | UI/UX Dev | 1 |

**Milestone:** Upload a photo → see predicted label + confidence score in browser.

---

### Week 3 — Guidance System
**Goal:** Per-category disposal guidance fully editable by admin.

| Task | Owner(s) | Days |
|---|---|---|
| `WasteCategory` + `GuidanceEntry` models & admin site | Backend Lead | 1 |
| Seed 6 categories with initial guidance text | AI/ML Lead | 1 |
| `GET /api/guidance/` and `GET /api/guidance/{slug}/` | Backend Lead | 1 |
| `GuidancePage` and `GuidanceCard` component | Frontend Lead | 2 |
| Link classifier result → guidance card automatically | Frontend Lead | 1 |
| Admin CRUD for guidance (DRF + Django admin or custom UI) | Backend Lead | 2 |
| `PredictionCorrection` model + `POST /api/classify/{id}/correct/` | Backend Lead | 1 |

**Milestone:** Classification result auto-links to guidance; admin can edit guidance in browser.

---

### Week 4 — Community Report Submission
**Goal:** Users can submit a geotagged report with photo.

| Task | Owner(s) | Days |
|---|---|---|
| `WasteReport` model + migrations | Backend Lead | 1 |
| `POST /api/reports/` endpoint with file upload | Backend Lead | 2 |
| `GET /api/reports/` with status/category filters | Backend Lead | 1 |
| `ReportFormPage`: form + leaflet coordinate picker | Frontend Lead | 3 |
| Coordinate input (map click or manual lat/lng) | UI/UX Dev | 2 |
| File upload preview in form | Frontend Lead | 1 |

**Milestone:** Submit a report → record appears in DB with photo, coords, category.

---

### Week 5 — Interactive Map & Filters
**Goal:** Approved reports appear on map with working filters.

| Task | Owner(s) | Days |
|---|---|---|
| `MapPage` + React Leaflet integration | Frontend Lead | 2 |
| `MapView` + `MapMarker` per category/status | UI/UX Dev | 2 |
| `FilterBar` component (category, status, date range) | UI/UX Dev | 2 |
| Backend filter support in `GET /api/reports/` | Backend Lead | 1 |
| Cluster markers for dense areas (optional) | Frontend Lead | 1 |

**Milestone:** Map shows approved reports with colour-coded markers; filters work.

---

### Week 6 — Admin Dashboard & Analytics
**Goal:** Admin can moderate reports and view statistics.

| Task | Owner(s) | Days |
|---|---|---|
| Admin report list + status update endpoint (`PATCH /api/admin/reports/{id}/`) | Backend Lead | 2 |
| `AdminReports` page with approve / reject / resolve actions | UI/UX Dev | 2 |
| `GET /api/analytics/summary/` endpoint | Backend Lead | 2 |
| `AdminAnalytics` page: `CategoryPieChart`, `ReportStatusBar`, `ReportTimelineChart` | UI/UX Dev | 2 |
| `AdminGuidance` CRUD UI | Frontend Lead | 1 |

**Milestone:** Admin can moderate all reports; analytics dashboard shows real data.

---

### Week 7 — Model Fine-Tuning, Evaluation & Integration Polish
**Goal:** Best-available model in production; end-to-end flows polished.

| Task | Owner(s) | Days |
|---|---|---|
| Phase 2 fine-tuning (unfreeze top layers) | AI/ML Lead | 2 |
| `evaluate.py`: confusion matrix, classification report | AI/ML Lead | 2 |
| Write `docs/MODEL_EVALUATION.md` | AI/ML Lead | 1 |
| Fix any cross-app integration bugs | Full team | 2 |
| Responsive layout audit & Tailwind fixes | UI/UX Dev | 2 |
| `HelpPage` and `AboutPage` content | UI/UX Dev | 1 |

**Milestone:** Model evaluation documented; app is fully responsive on mobile.

---

### Week 8 — Testing, Deployment & Documentation
**Goal:** All deliverables complete and deployed.

| Task | Owner(s) | Days |
|---|---|---|
| Functional test cases (Pytest + Django test client) | QA Lead | 2 |
| API test cases (`pytest` + `pytest-django`) | QA Lead | 2 |
| Frontend smoke tests (manual or Playwright) | QA Lead | 1 |
| Deployment: backend (Railway / Render / VPS) | QA Lead / Backend | 2 |
| Deployment: frontend (Vercel / Netlify) | QA Lead / Frontend | 1 |
| `README.md` + `USER_GUIDE.md` | QA Lead | 2 |
| Known-limitations section in docs | Full team | 1 |
| Final demonstration preparation | Full team | 1 |

**Milestone:** Live URL works; all deliverables submitted.

---

## 8. Branching & Workflow

```
main              ← production-ready code only
├── develop       ← integration branch
│   ├── feat/classification-endpoint
│   ├── feat/report-form
│   ├── feat/map-view
│   └── feat/admin-dashboard
└── hotfix/*      ← emergency fixes to main
```

- PRs require 1 reviewer before merge to `develop`.
- `develop` is merged to `main` at the end of each weekly milestone.
- Commit messages follow Conventional Commits.

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Model accuracy below 70 % | Medium | High | Augment dataset; lower confidence threshold; label uncertain clearly |
| Leaflet tile provider rate-limits | Low | Medium | Use OSM tiles; cache tiles locally |
| Free hosting tier limits exceeded | Medium | Medium | Use Render + Supabase free tier; monitor usage |
| Team member unavailability | Low | Medium | Shared ownership of modules; documented local setup |
| PDF/image upload size abuse | Low | Low | Validate file type (JPEG/PNG/WEBP) and size (≤ 5 MB) on both ends |

---

## 10. Definition of Done (Per Feature)

- [ ] Backend endpoint documented in `API_SPEC.md` and returns correct status codes.
- [ ] Frontend page works on 375 px (mobile) and 1280 px (desktop).
- [ ] At least one `pytest` test case covers the happy path and one error path.
- [ ] No console errors in browser; Tailwind classes reviewed.
- [ ] Code reviewed and merged to `develop`.

