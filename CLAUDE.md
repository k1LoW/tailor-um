# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
make build          # Generate frontend + build Go binary
make generate       # Build frontend and embed assets (go generate ./internal/static/)
make test           # Run Go tests with coverage
make lint           # Run golangci-lint + oxlint + oxfmt check
make ci             # Full CI pipeline: depsdev -> generate -> test
make dev-frontend   # Start Vite dev server (proxies /_/ to localhost:18686)
make credits        # Regenerate CREDITS file
```

Frontend-only commands (from `internal/frontend/`):
```bash
pnpm run build      # TypeScript check + Vite production build -> ../static/dist/
pnpm run lint       # oxlint
pnpm run fmt        # oxfmt (write)
pnpm run fmt:check  # oxfmt (check only)
```

Running the server locally:
```bash
# With SDK config tokens (after npx tailor-sdk login):
./tailor-um start --workspace-id <ID> --app <NAME> --machine-user <USER>

# With explicit tokens:
./tailor-um start --workspace-id <ID> --app <NAME> --machine-user <USER> --token <TOKEN> --refresh-token <RTOKEN>
```

## Architecture

Single Go binary with an embedded React SPA. The Go server serves both the API (`/_/api/*`) and the SPA (fallback to `index.html`).

### Go Backend

- `cmd/start.go` - CLI entry point. Resolves tokens (flag/env/SDK config/keyring), discovers application schema from Controlplane, starts HTTP server.
- `internal/tailor/client.go` - Tailor Platform OperatorService client with auto-refresh interceptor. On unauthenticated errors, refreshes the token and retries.
- `internal/tailor/application.go`, `auth.go`, `tailordb.go` - Controlplane RPC wrappers to fetch Application, Auth/IdP config, and TailorDB type schema.
- `internal/tailor/script_templates.go` - Generates JavaScript code strings for `TestExecScript` RPC. UserProfile CRUD uses `tailordb.Client` SQL, IdP user CRUD uses `tailor.idp.Client`.
- `internal/tailor/sdkconfig.go` - Reads/writes Tailor SDK config (`~/.config/tailor-platform/config.yaml`). Supports both file-based (v1) and keyring-based (v2) token storage.
- `internal/tailor/token.go` - OAuth2 token refresh via platform token endpoint.
- `internal/server/` - HTTP handlers. `server.go` registers routes + SPA fallback. Handlers delegate to `ExecScript` for all data operations.
- `internal/static/static.go` - `//go:embed all:dist` embeds the built frontend. `//go:generate` triggers `pnpm install && pnpm run build`.

### Frontend (React SPA)

Located in `internal/frontend/`. Built with React 19, Vite 8, Tailwind CSS 4, shadcn/ui components.

- `src/App.tsx` - Router, search bar, tab switching between User and IdP Users lists.
- `src/components/UserProfileTable.tsx`, `IdPUserTable.tsx` - List views with pagination.
- `src/components/UserProfileView.tsx`, `IdPUserView.tsx` - Detail views with inline edit, linked record display, and delete.
- `src/components/SearchResults.tsx` - Exact-match search results showing both User and IdP User.
- `src/api/client.ts` - Fetch wrapper for `/_/api/*` endpoints.
- `src/styles/app.css` - Theme variables (light/dark) using CSS custom properties + `@theme` for Tailwind v4. Dark mode via `.dark` class on `<html>`.

### Data Flow

1. Frontend calls `/_/api/*` endpoints
2. Go handler builds a JavaScript script from templates (`script_templates.go`)
3. Script is executed on the platform via `TestExecScript` RPC
4. Result (JSON string) is returned directly to the frontend

### Token Resolution Order

1. `--token` flag / `TAILOR_TOKEN` env var
2. Tailor SDK config file (`current_user`'s tokens, supporting both file and keyring storage)
3. If expired, proactive refresh before connecting; refreshed tokens written back to SDK config

## Key Conventions

- Default server port: 18686
- API routes prefixed with `/_/api/`
- SPA fallback: any non-file GET serves `index.html`
- Structured JSON logging to stderr (`slog.NewJSONHandler`)
- All RPC calls logged at INFO level
- Tailwind v4 dark mode: CSS variables defined in `:root` and `.dark`, referenced via `@theme` block (not `@theme inline`, which doesn't support dynamic overrides)
- SDK config keyring service name: `"tailor-platform-cli"` (shared with Tailor SDK)
