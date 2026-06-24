# Forge — Workout & Food Tracker

A mobile-first gym companion: log your lifts set-by-set against a weekly plan (even when you don't
hit the target), track meals and macros, browse an exercise library with photos when you don't
know a movement's name, and watch your strength and weight trend over time.

## Stack

- **Web**: React + TypeScript + Vite, Tailwind CSS v4, TanStack Query, React Router, Zustand,
  Framer Motion, Recharts.
- **API**: Node.js + Express + TypeScript, Prisma, Zod, JWT (httpOnly cookies), bcrypt.
- **DB**: PostgreSQL (via Docker Compose for local dev).
- **Shared**: `packages/shared` — Zod schemas, enums, and calculation utilities (BMR/TDEE/macros,
  plan-vs-actual set status) used by both the API and the web app, so validation never drifts
  between client and server.

## Project layout

```
apps/server   Express API, Prisma schema + migrations + seed scripts
apps/web      React app (mobile-first, responsive up to desktop)
packages/shared  Zod schemas, enums, BMR/macro + set-status calculators
```

## First-time setup

```bash
docker compose up -d              # starts Postgres on localhost:5432
npm install                       # installs all workspaces
cp apps/server/.env.example apps/server/.env   # already done if you cloned this repo as-is
npm run build --workspace=packages/shared      # compile the shared package
npm run db:migrate                # applies the Prisma schema
npm run db:seed                   # seeds ~870 exercises (free-exercise-db) + ~80 reference foods
```

The exercise seed fetches `exercises.json` and references images directly from the public-domain
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) dataset on GitHub — it needs
internet access the first time you seed, but the images are then just `<img>` URLs at runtime
(no re-hosting needed).

## Running locally

```bash
npm run dev
```

This runs the API (`http://localhost:4000`) and the web app (`http://localhost:5173`) together.
The Vite dev server proxies `/api/*` to the API, so cookies and CORS just work — open
`http://localhost:5173` and sign up.

## Other scripts

```bash
npm run lint        # ESLint across server + web
npm run typecheck   # tsc --noEmit across server, web, shared
npm run test        # Vitest: shared calculators + server integration tests
npm run build        # production build of all three packages
```

## Exercise media storage (local disk or S3)

Users can upload their own photo/GIF/video for any exercise (`ExerciseMedia`, scoped per-user).
Where those files land is controlled by `STORAGE_DRIVER` in `apps/server/.env`:

- **`STORAGE_DRIVER=local`** (default) — files are written to their own dedicated folder,
  `apps/server/uploads/exercise-media/` (gitignored, created automatically), and served back at
  `${PUBLIC_BASE_URL}/uploads/exercise-media/<file>`. Nothing else to configure — this is what a
  fresh `git clone` + `npm run dev` uses.
- **`STORAGE_DRIVER=s3`** — files are uploaded to an S3-compatible bucket instead. Set:
  ```bash
  STORAGE_DRIVER=s3
  S3_BUCKET=your-bucket
  S3_REGION=us-east-1
  S3_ACCESS_KEY_ID=...
  S3_SECRET_ACCESS_KEY=...
  # optional — only for S3-compatible providers (Cloudflare R2, MinIO, etc.)
  S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
  # optional — custom public URL base (e.g. a CDN domain) instead of the raw bucket URL
  S3_PUBLIC_URL_BASE=https://media.example.com
  ```
  The server validates these at boot (it fails fast with a clear error if `STORAGE_DRIVER=s3` is
  set but the required vars are missing) rather than failing on the first upload.

Switching between drivers is just changing `STORAGE_DRIVER` and restarting the server — the
`ExerciseMedia.url` already stored for existing uploads keeps working either way; only new uploads
go to the newly selected driver. See `apps/server/src/lib/storage.ts` for the driver
implementations and `apps/server/.env.example` for the full list of variables.

## Cardio log

A lightweight daily cardio entry (`CardioLog`, one row per user per day) sits alongside the
workout/food tracking: steps, post-workout walk minutes, and optional HIIT minutes. Tap the
"Cardio today" tile on the Today screen to log or edit any of the three fields — each is optional
and independent, so you can log steps in the morning and add walk minutes after the gym without
overwriting what's already there (`POST /api/cardio-logs` upserts by day).

## Notes on the data model

- A user's weekly plan is a `Routine` → `RoutineDay` (Mon–Sun) → `RoutineExercise` (target sets/
  reps/rest/weight/rotation pool). The default routine assigned on onboarding is the 6-day Push/
  Pull/Legs aesthetic split defined in
  `apps/server/src/modules/routines/defaultRoutineTemplate.ts` (Mon Push A, Tue Pull A, Wed Legs A,
  Thu Push B, Fri Pull B, Sat Legs B, Sun rest) and is fully editable per day afterward. Slots that
  the program lists as "X / Y" (e.g. Goblet/Hack Squat) are seeded as exercise `X` with `Y` already
  loaded into its rotation pool, so swapping is one tap on the Exercise Detail page's Rotation
  control instead of two separate routine rows.
  - **Re-applying the template to an account that already onboarded** (e.g. after editing the
    template, or for the maintainer's own account on a fresh deploy): the previous active routine
    is deactivated, not deleted, so logged history stays intact.
    ```bash
    npm run db:apply-default-routine --workspace=apps/server -- --email you@example.com
    ```
    Run this with `DATABASE_URL` pointed at whichever database you mean to update — your local
    `.env` for dev, or the production connection string for the deployed app. New signups always
    get the current template automatically at onboarding; this script is only for accounts that
    onboarded before the template last changed.
- Logging a workout creates a `WorkoutSession` → `SessionExercise` (a snapshot of that day's
  targets, so editing the routine later doesn't rewrite history) → `SetLog` rows. Whether an
  exercise is "on track" (`MET` / `PARTIAL` / `NOT_LOGGED`) is computed on the fly from target vs.
  logged sets (see `packages/shared/src/calc/setStatus.ts`) — nothing blocks saving an incomplete
  session.
- Daily calorie/macro targets come from Mifflin-St Jeor BMR × activity multiplier, adjusted by goal
  (see `packages/shared/src/calc/bmr.ts`), computed at onboarding and recomputed whenever goals are
  edited from Profile.

## What's intentionally deferred

- **Call a Trainer** is a visible nav entry with a "Coming soon" screen — no real-time video/voice
  in this version, by design (see Profile → Call a Trainer).
- No production deployment/hosting is configured — this is set up for local development. For a
  real deployment you'd add a reverse proxy that serves the web build and forwards `/api/*` to the
  Express server (or configure `CORS`/`WEB_ORIGIN` for separate origins), plus a managed Postgres
  instance.

### Workout tracker roadmap (not built yet)

The exercise detail page (media upload, set/rotation/rest/weight controls), the guided
one-exercise-at-a-time session flow with auto-fill and set types, and the themed rest
timer/stopwatch are implemented. Deliberately **not** built in this pass, left as follow-ups:

- Personal-record (PR) detection/notifications.
- "2-for-2" auto progression suggestions (auto-prompting a weight increase after two sessions
  above the top of the rep range).
- Progress charts beyond what already exists on the Progress tab (e.g. volume-per-muscle-group,
  estimated 1-rep-max trend).
- Deload-week reminders.
- Plate calculator (given a target barbell weight, show plates per side).
- Indian food quick-add database / meal templates (Diary supports custom + searched foods today).
- Bodyweight weekly-average trend, waist tracking, and progress-photo compare.
- CSV export of workout history.
- Full offline-first support (service worker + local queue/sync) — the app is online-first today;
  all logging requires a network connection.
