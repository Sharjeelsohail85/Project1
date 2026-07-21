# Migration System Deployment Checklist

## Scope
- Frontend migration route and components are wired to [`src/pages/Studio/MigratePostPage.jsx`](../src/pages/Studio/MigratePostPage.jsx), [`src/components/migration/MigrationForm.jsx`](../src/components/migration/MigrationForm.jsx), and [`src/hooks/useVideoMigration.js`](../src/hooks/useVideoMigration.js).
- Backend migration endpoints are wired in [`Video-master/app/Modules/Video/routes.php`](app/Modules/Video/routes.php) and implemented in [`Video-master/app/Modules/Video/Controllers/VideoApiController.php`](app/Modules/Video/Controllers/VideoApiController.php).

## API Contract Checklist
- [x] `POST /api/v1/migration/validate`
  - Rejects playlist manifests (`.m3u8`, `.mpd`, `manifest`, `playlist`).
  - Returns normalized payload with `valid`, `size`, `mime`, `filename`.
- [x] `POST /api/v1/migration/start`
  - Validates source and metadata.
  - Creates migration `jobId` and stores initial state in cache.
- [x] `GET /api/v1/migration/status/{jobId}`
  - Returns progress payload fields: `progress`, `stage`, `completed`, `videoId`, `error`.
  - Enforces ownership by comparing cached `userId` with middleware-injected request `id`.
- [x] `GET /api/v1/videos/{id}/stream-url`
  - Resolves direct stream URL using token/client_id when available.

## Queue and Async Requirements
- [ ] Set `QUEUE_DRIVER=redis` (or `database`) in production.
- [ ] Run queue workers (example):
  - `php artisan queue:work --queue=default --sleep=1 --tries=3 --timeout=900`
- [ ] Add worker process supervision (Supervisor/systemd/container orchestrator).
- [ ] Ensure retry/failure handling visibility (`failed_jobs` table / logging).

> Updated implementation dispatches `MigrateVideoJob` from `POST /migration/start` and keeps `GET /migration/status/{jobId}` read-only.
>
> Current `.env.example` still defaults to `QUEUE_DRIVER=sync`, which executes the job inline. For true async behavior, set queue driver to `redis` or `database` and run workers.

## Cache and Progress State
- [ ] Set `CACHE_DRIVER=redis` in production.
- [ ] Verify cache TTL and eviction policy for migration job state keys (`migration:job:{jobId}`).
- [ ] Validate horizontal scaling behavior (shared cache across app instances).

## Storage / BYOS Checklist
- [x] Metadata-only persistence in DB (`videos.url` stores provider/local reference).
- [x] Stream resolution supports provider-backed URL patterns (`terabox://`, `mega://`, `hetzner://`).
- [ ] Remove hardcoded credential fallback in [`Video-master/config/filesystems.php`](config/filesystems.php:66) before production.
- [ ] Confirm provider credentials via env only:
  - `HETZNER_STORAGE_*`, `TERABOX_*`, `MEGA_*`, `IDRIVE_*`, `DRIME_*`.
- [ ] Validate max upload and temp storage capacity.

## Security Checklist
- [ ] Keep API protected by `general-access` middleware for mutating migration endpoints.
- [ ] Avoid wildcard CORS for privileged API routes in production.
- [ ] Use signed or short-lived stream URLs where feasible.
- [ ] Audit token/client_id propagation from frontend clients.

## Observability Checklist
- [ ] Add structured logs for migration lifecycle events (`start`, `download`, `upload`, `finalize`, `error`).
- [ ] Add metrics: total jobs, success/failure rate, average duration, provider failure breakdown.
- [ ] Alert on repeated provider auth failures.

## Test Checklist
- [x] Feature test added: [`Video-master/tests/Feature/MigrationFlowTest.php`](tests/Feature/MigrationFlowTest.php).
- [ ] Run backend tests: `php artisan test` or `vendor/bin/phpunit`.
- [ ] Run frontend build/tests for migration route and UI flows.

## Frontend Integration Checklist
- [x] Route entry updated so post action navigates to `/studio/migrate` in [`src/App.jsx`](../src/App.jsx).
- [x] Legacy `/post` redirects to `/studio/migrate`.
- [x] Content center route renders migration page in [`src/components/Content.jsx`](../src/components/Content.jsx).
- [x] Completion callback moved to effect-safe pattern in [`src/components/migration/MigrationForm.jsx`](../src/components/migration/MigrationForm.jsx).

## Rollout Plan
1. Deploy backend first with new migration routes/controller logic.
2. Verify `/api/v1/migration/validate` and `/api/v1/migration/start` with authenticated token/client_id.
3. Deploy frontend migration route/UI.
4. Enable queue/cache production drivers and workers.
5. Run smoke tests for provider connect, validate, start, status, and stream playback.

