# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal finance manager, split into two independent apps in one repo (each has its own `.git` — treat them as separate checkouts when committing):

- `/frontend` — Angular 22 (standalone components, SSR-capable via `@angular/ssr`), Tailwind CSS v4, UI text in Vietnamese.
- `/backend` — NestJS 11 REST API, Prisma ORM + SQLite.

The database is only ever accessed from `/backend`. The frontend talks to it exclusively through the backend's REST API — never query Prisma from the frontend, and never let the frontend assume direct DB access.

All VND monetary amounts are stored and passed as integers (no decimals/cents) end to end — DTOs, Prisma schema, and Angular models.

## Commands

### Frontend (`/frontend`)

```bash
npm start              # ng serve, http://localhost:4200
npm run build          # ng build (production)
npm run watch          # ng build --watch, development config
npm test               # ng test (Vitest)
```

Run a single test file/spec with Vitest by passing a path or name filter, e.g. `npx vitest run src/app/app.spec.ts`.

Formatting: Prettier is configured in `.prettierrc` (100 char width, single quotes, Angular parser for `.html`). No separate `npm run lint` script exists yet — run `npx prettier --check .` or add one before relying on it.

### Backend (`/backend`)

```bash
npm run start:dev      # nest start --watch
npm run build           # nest build
npm run lint            # eslint --fix over src/apps/libs/test
npm run test            # jest unit tests
npm run test:watch      # jest --watch
npm run test:e2e        # jest --config ./test/jest-e2e.json
```

Run a single test file: `npm run test -- app.controller.spec.ts` (Jest matches by filename/path substring). For e2e: `npm run test:e2e -- --testPathPattern app.e2e-spec`.

Prisma commands (once the schema exists under `backend/prisma/schema.prisma`):

```bash
npx prisma migrate dev      # create/apply a migration against the SQLite dev db
npx prisma generate         # regenerate the Prisma client
npx prisma studio           # inspect the SQLite db
```

### After implementing a feature

Run the relevant app's lint, test, and build before considering the work done (backend: `lint`, `test`, `build`; frontend: `test`, `build`).

## Architecture conventions

### Backend (NestJS)

- Organize by feature module (e.g. `accounts`, `transactions`, `categories`), each with its own controller, service, DTOs, and module file — mirror Nest's standard module structure, not a layered (all-controllers / all-services) structure.
- Every request body is validated via DTOs + a global `ValidationPipe` (whitelist/transform) — do not hand-validate in controllers.
- All Prisma access goes through a shared `PrismaService` (injectable, implements `OnModuleInit`/`OnModuleDestroy` to manage the connection) — feature services depend on `PrismaService`, they don't instantiate `PrismaClient` themselves.
- Follow REST conventions for routes/status codes/verbs (`GET /transactions`, `POST /transactions`, `PATCH /transactions/:id`, `DELETE /transactions/:id`, etc.) rather than RPC-style endpoints.
- ESLint config (`eslint.config.mjs`) has `no-explicit-any` off but `no-floating-promises` and `no-unsafe-argument` on as warnings — don't let those slide into errors when writing async Prisma/service code.

### Frontend (Angular)

- Standalone components only, no NgModules. Do not set `standalone: true` explicitly (default in v20+); do not set `changeDetection: OnPush` explicitly (default in v22+).
- Feature routes are lazy-loaded via `loadChildren`/`loadComponent` in `app.routes.ts`, which is currently empty — new features register their routes here.
- Use `input()`/`output()`/`model()` functions instead of decorators; `computed()` for derived state; `inject()` instead of constructor injection.
- Use Reactive Forms for anything beyond a trivial form; prefer Signal Forms (`@angular/forms/signals`) for new forms.
- State: signals for local component state, keep transformations pure, use `update`/`set` (never `mutate`).
- Templates use native control flow (`@if`/`@for`/`@switch`), no `ngClass`/`ngStyle` (use `class`/`style` bindings), async pipe for observables.
- Styling is Tailwind CSS v4 via `@tailwindcss/postcss` (`.postcssrc.json`) — keep the UI clean and responsive, all user-facing text in Vietnamese.
- Full accessibility bar: must pass AXE checks and meet WCAG AA (focus management, color contrast, ARIA).

### Cross-cutting

- Explain the plan before touching multiple files in one change.
- Don't add a new npm dependency (either app) without stating why it's needed first.
