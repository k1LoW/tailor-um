# tailor-um

`tailor-um` is a **u**ser **m**anagement CLI for [Tailor Platform](https://docs.tailor.tech/) applications.

It starts a local Web UI server that lets you manage users through a browser.

## Features

- Web UI for user profile CRUD operations (powered by embedded React SPA)
- Dynamic form generation based on TailorDB Type schema
- Built-in IdP user management (create, update, disable, delete)
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

```console
$ tailor-um start \
    --workspace-id <WORKSPACE_ID> \
    --app <APPLICATION_NAME> \
    --machine-user <MACHINE_USER_NAME> \
    --token <ACCESS_TOKEN>
```

`tailor-um start` connects to the Tailor Platform Controlplane, discovers the application's Auth UserProfile schema, and starts a local Web UI server on `http://localhost:18686`.

### Environment variables

All required flags can also be set via environment variables:

| Flag | Environment Variable |
|------|---------------------|
| `--workspace-id` | `TAILOR_WORKSPACE_ID` |
| `--app` | `TAILOR_APP_NAME` |
| `--machine-user` | `TAILOR_MACHINE_USER` |
| `--token` | `TAILOR_TOKEN` |
| `--platform-url` | `PLATFORM_URL` |

```console
$ export TAILOR_WORKSPACE_ID=<WORKSPACE_ID>
$ export TAILOR_APP_NAME=<APPLICATION_NAME>
$ export TAILOR_MACHINE_USER=<MACHINE_USER_NAME>
$ export TAILOR_TOKEN=<ACCESS_TOKEN>
$ tailor-um start
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--workspace-id` | | Tailor Platform workspace ID |
| `--app` | | Application name |
| `--machine-user` | | Machine user name |
| `--token` | | Controlplane access token |
| `--port` | `18686` | Server port |
| `--bind` | `localhost` | Bind address |
| `--no-open` | `false` | Do not open browser automatically |
| `--platform-url` | `https://api.tailor.tech` | Tailor Platform API URL |

## How it works

1. Connects to the Tailor Platform Controlplane using the provided access token
2. Fetches the Application's Auth configuration to find the UserProfile TailorDB Type
3. Retrieves the TailorDB Type schema (field names, types, constraints)
4. Checks if the Application uses a Built-in IdP
5. Starts an HTTP server with an embedded React SPA
6. The Web UI calls the local API server, which executes CRUD operations via `TestExecScript` RPC

If a Built-in IdP is configured, the Web UI shows an additional tab for managing IdP users (create, update password, disable, delete).

## Build

Requires Go and [pnpm](https://pnpm.io/).

```console
$ make build
```

## License

[MIT License](LICENSE)
