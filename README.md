# BaseForge v2 — Phase 1

Private MVP implementation for authenticated dashboard + draft project CRUD + public runtime rendering.

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
QUICK_AUTH_DOMAIN=
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure Supabase tables already exist (`users`, `plans`, `projects`) with the required columns and unique index `(owner_wallet, project_slug)`.
3. Configure Farcaster Quick Auth domain in `QUICK_AUTH_DOMAIN`.

## Local run

```bash
npm run dev
```

Open `http://localhost:3000` and use:
- dashboard routes: `/dashboard`, `/dashboard/new`, `/dashboard/[wallet]/[projectSlug]/edit`
- runtime route: `/app/[wallet]/[projectSlug]`

## Phase 0 + Phase 1 test checklist

- Authenticate in Farcaster Mini App context.
- Dashboard shows connected lowercase wallet, FID, and owned projects.
- Create draft project from `/dashboard/new`.
- Edit project at `/dashboard/[wallet]/[projectSlug]/edit`:
  - update `name`
  - add/remove/update `text`, `button`, `wallet_connect` components
  - optional advanced JSON editor still works
  - slug remains immutable
  - status remains `draft`
- API security checks:
  - requests without bearer token fail with `{ "error": "..." }`
  - wallet mismatch fails
  - invalid slug fails
  - invalid wallet format fails (`0x` + 40 lowercase hex chars)

### Phase 1 runtime test plan

1. Create a project draft.
2. In Supabase, set project `status = 'published'`.
3. Open `/app/:wallet/:projectSlug` and confirm the project renders components.
4. Set status back to `draft` and confirm runtime shows friendly `Not published yet`.

## Notes

- All wallet addresses are normalized to lowercase and validated as `0x` + 40 lowercase hex chars.
- Server APIs verify Farcaster JWT before reads/writes.
- Public runtime data is served by `/api/public/projects/[wallet]/[projectSlug]`.
- Runtime safely ignores unknown/invalid components and enforces per-plan render caps (`basic: 5`, `pro: 25`).
- No payment or publish verification logic is included yet (Phase 2).
