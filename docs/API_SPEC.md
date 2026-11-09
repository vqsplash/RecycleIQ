# RecycleIQ — API Specification

> Version 1.0 · November 2026  
> Base URL (development): `http://localhost:8000/api`  
> Base URL (production): `https://<backend-host>/api`  
> Content-Type: `application/json` unless noted as `multipart/form-data`  
> Authentication: `Authorization: Bearer <access_token>` (JWT)

---

## Conventions

| Symbol | Meaning |
|---|---|
| 🔓 | No authentication required |
| 🔑 | Authenticated user required |
| 🛡️ | Admin (`is_staff = True`) required |
| `{id}` | Integer primary key path parameter |
| `{slug}` | Category slug path parameter (e.g. `plastic`) |

All error responses follow:
```json
{ "detail": "Human-readable error message" }
```
Validation errors return field-level detail:
```json
{ "field_name": ["Error description."] }
```

---

## 1. Authentication — `/auth/`

### 1.1 Register
```
POST /auth/register/   🔓
```
**Request body:**
```json
{
  "username": "string (3–150 chars)",
  "email": "user@example.com",
  "password": "string (min 8 chars)",
  "password_confirm": "string"
}
```
**Response `201 Created`:**
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com"
}
```
**Errors:** `400` — username taken, passwords don't match, weak password.

---

### 1.2 Obtain Token (Login)
```
POST /auth/token/   🔓
```
**Request body:**
```json
{
  "username": "string",
  "password": "string"
}
```
**Response `200 OK`:**
```json
{
  "access": "<JWT access token>",
  "refresh": "<JWT refresh token>"
}
```
**Errors:** `401` — invalid credentials.

---

### 1.3 Refresh Token
```
POST /auth/token/refresh/   🔓
```
**Request body:**
```json
{ "refresh": "<JWT refresh token>" }
```
**Response `200 OK`:**
```json
{ "access": "<new JWT access token>" }
```
**Errors:** `401` — token expired or invalid.

---

### 1.4 Get Current User
```
GET /auth/me/   🔑
```
**Response `200 OK`:**
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "is_staff": false
}
```

---

## 2. Classification — `/classify/`

### 2.1 Classify an Image
```
POST /classify/   🔓 (anonymous allowed; user linked if authenticated)
Content-Type: multipart/form-data
```
**Request fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `image` | file | ✅ | JPEG, PNG, or WEBP; max 5 MB |

**Response `200 OK`:**
```json
{
  "id": 42,
  "predicted_label": "plastic",
  "confidence": 0.87,
  "is_uncertain": false,
  "top3": [
    { "label": "plastic",   "score": 0.87 },
    { "label": "metal",     "score": 0.08 },
    { "label": "cardboard", "score": 0.03 }
  ],
  "guidance_url": "/api/guidance/plastic/",
  "image_url": "/media/predictions/abc123.jpg",
  "created_at": "2026-11-09T10:00:00Z"
}
```

**Uncertain result (`confidence < 0.60`) — same `200 OK`:**
```json
{
  "id": 43,
  "predicted_label": "paper",
  "confidence": 0.45,
  "is_uncertain": true,
  "top3": [ ... ],
  "guidance_url": "/api/guidance/paper/",
  "image_url": "/media/predictions/xyz789.jpg",
  "created_at": "2026-11-09T10:01:00Z"
}
```

**Errors:**
- `400` — missing/invalid file, unsupported format, file too large.
- `503` — model not loaded (startup failure).

---

### 2.2 Get Prediction Detail
```
GET /classify/{id}/   🔑
```
Returns the same shape as `POST /classify/` response.  
**Errors:** `404` — not found; `403` — belongs to another user (non-admin).

---

### 2.3 Submit Prediction Correction
```
POST /classify/{id}/correct/   🔑
```
Allows a user to flag the predicted label as wrong and provide the correct one.

**Request body:**
```json
{ "correct_label": "cardboard" }
```
`correct_label` must be one of the supported category slugs.

**Response `201 Created`:**
```json
{
  "id": 7,
  "prediction": 42,
  "correct_label": "cardboard",
  "created_at": "2026-11-09T10:05:00Z"
}
```
**Errors:** `400` — invalid label; `404` — prediction not found.

---

## 3. Guidance — `/guidance/`

### 3.1 List All Categories with Guidance
```
GET /guidance/   🔓
```
**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "slug": "cardboard",
    "name": "Cardboard",
    "icon_url": "/media/icons/cardboard.svg",
    "guidance": {
      "title": "Recycling Cardboard",
      "body": "Flatten boxes before placing in the blue bin...",
      "updated_at": "2026-11-01T08:00:00Z"
    }
  },
  { "id": 2, "slug": "paper", ... },
  ...
]
```

---

### 3.2 Get Guidance for a Single Category
```
GET /guidance/{slug}/   🔓
```
**Response `200 OK`:**
```json
{
  "id": 5,
  "slug": "plastic",
  "name": "Plastic",
  "icon_url": "/media/icons/plastic.svg",
  "guidance": {
    "title": "Recycling Plastic",
    "body": "Check the recycling number on the bottom...",
    "updated_at": "2026-11-02T12:00:00Z"
  }
}
```
**Errors:** `404` — unknown slug.

---

### 3.3 Admin — Update Guidance for a Category
```
PUT /guidance/{slug}/   🛡️
```
**Request body:**
```json
{
  "title": "Updated title",
  "body": "Updated disposal instructions..."
}
```
**Response `200 OK`:** Same shape as `GET /guidance/{slug}/`.  
**Errors:** `400` — validation; `404` — unknown slug.

---

## 4. Community Reports — `/reports/`

### 4.1 List Approved Reports (Public Map Data)
```
GET /reports/   🔓
```
Returns only `status=approved` by default for anonymous users.  
Authenticated users see their own reports regardless of status.  
Admins see all reports.

**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `status` | string | Filter: `pending`, `approved`, `rejected`, `resolved` |
| `category` | string | Category slug, e.g. `plastic` |
| `date_from` | ISO 8601 date | Inclusive lower bound on `created_at` |
| `date_to` | ISO 8601 date | Inclusive upper bound on `created_at` |
| `page` | integer | Page number (default 1) |
| `page_size` | integer | Results per page (default 20, max 100) |

**Response `200 OK`:**
```json
{
  "count": 85,
  "next": "/api/reports/?page=2",
  "previous": null,
  "results": [
    {
      "id": 10,
      "user": { "id": 3, "username": "bob" },
      "category": { "id": 5, "slug": "plastic", "name": "Plastic" },
      "description": "Large pile of plastic bottles near the lake.",
      "photo_url": "/media/reports/report10.jpg",
      "latitude": 23.8103,
      "longitude": 90.4125,
      "status": "approved",
      "created_at": "2026-11-05T09:30:00Z",
      "updated_at": "2026-11-06T14:00:00Z"
    },
    ...
  ]
}
```

---

### 4.2 Submit a Report
```
POST /reports/   🔑
Content-Type: multipart/form-data
```
**Request fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | string (slug) | ✅ | e.g. `glass` |
| `description` | string | ✅ | 10–500 characters |
| `latitude` | float | ✅ | Valid latitude (-90 to 90) |
| `longitude` | float | ✅ | Valid longitude (-180 to 180) |
| `photo` | file | ❌ | JPEG/PNG/WEBP, max 5 MB |

**Response `201 Created`:**
```json
{
  "id": 11,
  "user": { "id": 3, "username": "bob" },
  "category": { "id": 2, "slug": "glass", "name": "Glass" },
  "description": "Broken bottles scattered on pavement.",
  "photo_url": "/media/reports/report11.jpg",
  "latitude": 23.8201,
  "longitude": 90.4200,
  "status": "pending",
  "created_at": "2026-11-09T10:15:00Z",
  "updated_at": "2026-11-09T10:15:00Z"
}
```
**Errors:** `400` — validation; `401` — not authenticated.

---

### 4.3 Get Report Detail
```
GET /reports/{id}/   🔑
```
Returns full report object. Non-admin users can only retrieve their own reports.  
**Errors:** `403`, `404`.

---

### 4.4 Delete Own Report (before approval)
```
DELETE /reports/{id}/   🔑
```
Only allowed when `status = pending` and the requesting user is the submitter.  
**Response `204 No Content`.**  
**Errors:** `403` — approved or not owner; `404` — not found.

---

## 5. Admin — Reports Moderation — `/admin/reports/`

### 5.1 List All Reports (Admin)
```
GET /admin/reports/   🛡️
```
Same shape as `GET /reports/` but returns all statuses and all users.  
Supports all the same query parameters.

---

### 5.2 Update Report Status
```
PATCH /admin/reports/{id}/   🛡️
```
**Request body (partial update):**
```json
{ "status": "approved" }
```
`status` must be one of: `pending`, `approved`, `rejected`, `resolved`.

**Response `200 OK`:** Full report object with updated status and `reviewed_by` set to the admin.  
**Errors:** `400` — invalid status; `404` — not found.

---

## 6. Analytics — `/analytics/`

### 6.1 Summary Statistics
```
GET /analytics/summary/   🛡️
```
**Response `200 OK`:**
```json
{
  "total_predictions": 342,
  "total_reports": 85,
  "reports_by_status": {
    "pending":  12,
    "approved": 60,
    "rejected":  8,
    "resolved":  5
  },
  "predictions_by_category": {
    "plastic":   98,
    "paper":     72,
    "glass":     55,
    "cardboard": 48,
    "metal":     40,
    "organic":   29
  },
  "reports_by_category": {
    "plastic":   30,
    "glass":     18,
    "organic":   12,
    "cardboard":  10,
    "paper":      9,
    "metal":       6
  },
  "uncertain_predictions": 34,
  "corrections_submitted": 18
}
```

---

### 6.2 Report Timeline
```
GET /analytics/timeline/   🛡️
```
**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `granularity` | `day` \| `week` \| `month` | Time bucket size (default `week`) |
| `date_from` | ISO 8601 date | Start of range |
| `date_to` | ISO 8601 date | End of range |

**Response `200 OK`:**
```json
{
  "granularity": "week",
  "data": [
    { "period": "2026-10-05", "predictions": 45, "reports": 12 },
    { "period": "2026-10-12", "predictions": 62, "reports": 18 },
    { "period": "2026-10-19", "predictions": 78, "reports": 22 },
    { "period": "2026-10-26", "predictions": 91, "reports": 20 },
    { "period": "2026-11-02", "predictions": 66, "reports": 13 }
  ]
}
```

---

## 7. Health Check

### 7.1 API Health
```
GET /health/   🔓
```
**Response `200 OK`:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "db": "ok"
}
```
Used by the CI pipeline and deployment health checks.

---

## 8. URL Route Table

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/` | 🔓 | Register new user |
| POST | `/auth/token/` | 🔓 | Obtain JWT tokens |
| POST | `/auth/token/refresh/` | 🔓 | Refresh access token |
| GET | `/auth/me/` | 🔑 | Get current user info |
| POST | `/classify/` | 🔓 | Upload image, get prediction |
| GET | `/classify/{id}/` | 🔑 | Retrieve prediction |
| POST | `/classify/{id}/correct/` | 🔑 | Submit label correction |
| GET | `/guidance/` | 🔓 | List all categories + guidance |
| GET | `/guidance/{slug}/` | 🔓 | Get guidance for one category |
| PUT | `/guidance/{slug}/` | 🛡️ | Update guidance (admin only) |
| GET | `/reports/` | 🔓 | List approved reports (public map) |
| POST | `/reports/` | 🔑 | Submit new report |
| GET | `/reports/{id}/` | 🔑 | Retrieve own report |
| DELETE | `/reports/{id}/` | 🔑 | Delete own pending report |
| GET | `/admin/reports/` | 🛡️ | List all reports (admin) |
| PATCH | `/admin/reports/{id}/` | 🛡️ | Update report status (admin) |
| GET | `/analytics/summary/` | 🛡️ | Summary statistics |
| GET | `/analytics/timeline/` | 🛡️ | Report/prediction timeline |
| GET | `/health/` | 🔓 | API health check |

---

## 9. HTTP Status Code Reference

| Code | Meaning | When Used |
|---|---|---|
| 200 | OK | Successful GET / PUT / PATCH |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, bad input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Authenticated but insufficient permission |
| 404 | Not Found | Resource does not exist |
| 503 | Service Unavailable | ML model not loaded |

---

## 10. Pagination

All list endpoints returning potentially large datasets use **cursor-based** or **page-number** pagination:

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/reports/?page=3",
  "previous": "http://localhost:8000/api/reports/?page=1",
  "results": [ ... ]
}
```

Default `page_size` is **20**; maximum is **100**.

---

## 11. File Upload Rules

| Field | Allowed MIME types | Max size | Storage path |
|---|---|---|---|
| Classify `image` | `image/jpeg`, `image/png`, `image/webp` | 5 MB | `MEDIA_ROOT/predictions/` |
| Report `photo` | `image/jpeg`, `image/png`, `image/webp` | 5 MB | `MEDIA_ROOT/reports/` |

Filenames are replaced with UUIDs server-side to prevent path traversal.

---

## 12. Supported Category Slugs

The following slugs are valid for `correct_label`, `category` filter, and guidance endpoints:

```
cardboard | paper | glass | metal | plastic | organic
```

Any other value returns `400 Bad Request`.

