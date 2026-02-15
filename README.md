# BaseForge v2 — Phase 0

Private MVP implementation for authenticated dashboard + draft project CRUD.

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

Open `http://localhost:3000` and go to `/dashboard`.

## Phase 0 test checklist

- Authenticate in Farcaster Mini App context.
- Dashboard shows:
  - connected lowercase wallet
  - FID
  - owned projects list
- Create draft project from `/dashboard/new`.
- Edit project at `/dashboard/[wallet]/[projectSlug]/edit`:
  - can update `name`
  - can update `config_json`
  - slug remains immutable
  - status remains `draft`
- API security checks:
  - requests without bearer token fail with `{ "error": "..." }`
  - wallet mismatch fails
  - invalid slug fails
  - invalid wallet format fails (`0x` + 40 lowercase hex chars)

## Notes

- All wallet addresses are normalized to lowercase and validated as `0x` + 40 lowercase hex chars.
- Server APIs verify Farcaster JWT before reads/writes.
- No runtime renderer or payment logic is included in Phase 0.
- Canonical future runtime path remains `/app/:wallet/:projectSlug`.
