# Draped — Web Frontend

Next.js 14 web app for the AI Virtual Try-On platform.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, CTA |
| `/auth` | Google Sign-In |
| `/tryon` | Core try-on experience (upload + generate) |
| `/gallery` | User's saved results |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom CSS variables
- **State**: Zustand (persisted auth)
- **HTTP**: Axios with JWT interceptors
- **Fonts**: Cormorant Garamond (display) + DM Sans (body)
- **Uploads**: react-dropzone
- **Toasts**: react-hot-toast
- **Auth**: Google Identity Services (GSI)

## Design System

Warm editorial aesthetic — cream backgrounds, ink typography, rust accent (`#c45c2a`), Cormorant serif headings.

### Colors
```
--bg:           #faf7f2  (cream background)
--text-primary: #231d19  (near-black ink)
--accent:       #c45c2a  (rust/terracotta)
--border:       #e6ddd3  (warm grey)
```

### Typography
- **Display**: Cormorant Garamond (serif, editorial)
- **Body**: DM Sans (clean, legible)
- **Mono**: DM Mono (labels, codes)

## Setup

```bash
# Install
npm install

# Configure
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL and NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Develop
npm run dev

# Build
npm run build

# Start production
npm start
```

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000       # Backend API URL
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

## Deployment (Vercel)

```bash
npx vercel --prod
```

Set env vars in Vercel dashboard.

## API Integration

All API calls go through `src/lib/api.ts`:
- `authApi` — Google login, token refresh
- `jobsApi` — Create, status, result, list, delete
- `resultsApi` — List, favorite, delete
- `userApi` — Profile, quota

JWT tokens are stored in Zustand (persisted to localStorage).
Auto-refresh on 401 responses via axios interceptor.

## Key Components

### `src/app/tryon/page.tsx`
Core try-on flow:
1. `UploadZone` — dropzone for user photo + garment
2. `ProcessingState` — animated pipeline progress
3. `ResultState` — result display + download

### `src/hooks/useJobPoller.ts`
Polls `/api/v1/jobs/{id}/status` every 2.5 seconds.
Stops automatically when job completes or fails.

### `src/lib/store.ts`
Zustand stores:
- `useAuthStore` — user, tokens, isAuthenticated (persisted)
- `useTryonStore` — currentJob, previews
