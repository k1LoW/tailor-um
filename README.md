# tailor-um

`tailor-um` is a dataplane **u**ser **m**anagement tool for [Tailor Platform](https://docs.tailor.tech/) applications.

It starts a local Web UI server that lets you manage users through a browser.

## Features

- Web UI for user profile CRUD operations (powered by embedded React SPA)
- Dynamic form generation based on TailorDB Type schema
- Built-in IdP user management (create, update, disable, delete)
- Linked view between UserProfile and IdP User records
- Search by username (exact match)
- Dark / light theme (follows Tailor Console design)
- Token auto-refresh with SDK config integration
- Single binary with no external dependencies
- Auto-opens browser on start

## Install

**go install:**

```console
$ go install github.com/k1LoW/tailor-um@latest
```

**manually:**

Download binary from [releases page](https://github.com/k1LoW/tailor-um/releases)

## Usage

If you have already logged in with `npx tailor-sdk login`, just run:

```console
$ tailor-um start \
    --workspace-id <WORKSPACE_ID> \
    --app <APPLICATION_NAME> \
    --machine-user <MACHINE_USER_NAME>
```

`tailor-um` automatically reads tokens from the [Tailor SDK](https://github.com/tailor-platform/sdk) config (`~/.config/tailor-platform/config.yaml`). When the token expires, it refreshes automatically and writes the new tokens back to the config file.

You can also provide tokens explicitly:

```console
$ tailor-um start \
    --workspace-id <WORKSPACE_ID> \
    --app <APPLICATION_NAME> \
    --machine-user <MACHINE_USER_NAME> \
    --token <ACCESS_TOKEN> \
    --refresh-token <REFRESH_TOKEN>
```

`tailor-um start` connects to the Tailor Platform Controlplane, discovers the application's Auth UserProfile schema, and starts a local Web UI server on `http://localhost:18686`.

### Token resolution order

1. `--token` flag / `TAILOR_TOKEN` env var (if provided)
2. Tailor SDK config (`~/.config/tailor-platform/config.yaml`, `current_user`)

When using the SDK config, `token_expires_at` is checked. If expired, the token is refreshed before connecting. Refreshed tokens are written back to the SDK config so other tools stay in sync.

### Environment variables

All required flags can also be set via environment variables:

| Flag | Environment Variable |
|------|---------------------|
| `--workspace-id` | `TAILOR_WORKSPACE_ID` |
| `--app` | `TAILOR_APP_NAME` |
| `--machine-user` | `TAILOR_MACHINE_USER` |
| `--token` | `TAILOR_TOKEN` |
| `--refresh-token` | `TAILOR_REFRESH_TOKEN` |
| `--platform-url` | `PLATFORM_URL` |

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--workspace-id` | | Tailor Platform workspace ID |
| `--app` | | Application name |
| `--machine-user` | | Machine user name |
| `--token` | | Controlplane access token (optional if SDK config exists) |
| `--refresh-token` | | Controlplane refresh token for auto-refresh |
| `--port` | `18686` | Server port |
| `--bind` | `localhost` | Bind address |
| `--no-open` | `false` | Do not open browser automatically |
| `--platform-url` | `https://api.tailor.tech` | Tailor Platform API URL |

## How it works

1. Resolves access token (flag/env or SDK config, refreshing if expired)
2. Connects to the Tailor Platform Controlplane
3. Fetches the Application's Auth configuration to find the UserProfile TailorDB Type
4. Retrieves the TailorDB Type schema (field names, types, constraints)
5. Checks if the Application uses a Built-in IdP
6. Starts an HTTP server with an embedded React SPA
7. The Web UI calls the local API server, which executes CRUD operations via `TestExecScript` RPC

If a Built-in IdP is configured, the Web UI shows an additional tab for managing IdP users (create, update password, disable, delete). User profiles and IdP users are linked by the username field mapping.

## Build

Requires Go and [pnpm](https://pnpm.io/).

```console
$ make build
```

## License

[MIT License](LICENSE)
