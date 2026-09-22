# BetterAdmin for OpenCloud

BetterAdmin is a native OpenCloud Web extension that gives administrators a clearer view of
storage consumption without replacing the existing administration interface.

The current MVP provides:

- an entry inside the OpenCloud administration navigation;
- a storage overview for users and project spaces;
- quota warning and critical states;
- searchable user and space tables;
- French translations and automatic support for the active OpenCloud theme.

BetterAdmin uses the authenticated LibreGraph client supplied by OpenCloud. Access is restricted
through the same `Account` and `Drive` permissions as the built-in administration application.

## Development

Requirements: Docker, Docker Compose, Node.js, and pnpm 11.

```bash
pnpm install
pnpm build:w
```

In another terminal, start the bundled OpenCloud development environment:

```bash
docker compose up
```

Open `https://host.docker.internal:9200` and sign in with `admin` / `admin`. The extension is
mounted automatically under `/web/apps/betteradmin`.

## Quality checks

```bash
pnpm check:types
pnpm lint
pnpm test:unit --run
pnpm build
```

## Production installation

BetterAdmin 0.1.x targets OpenCloud Web 8.x.

### Install from a release

1. Download `web-app-betteradmin-v0.1.4.zip` from the latest GitHub release.
2. Create a `betteradmin` directory in the OpenCloud web apps directory.
3. Extract the archive into that directory. `manifest.json` must be directly inside the
   `betteradmin` directory, not inside an additional nested folder.

For a standard OpenCloud installation, the resulting path is usually:

```text
$OC_DATA_DIR/web/assets/apps/betteradmin/manifest.json
```

With `opencloud-compose`, extract it under:

```text
opencloud-compose/config/opencloud/apps/betteradmin/manifest.json
```

Restart OpenCloud after installation:

```bash
docker compose restart
```

Sign in as an administrator, open **Administration**, and select **BetterAdmin** in the sidebar.
BetterAdmin deliberately has no separate application-switcher entry.

### Build and install from source

```bash
pnpm install
pnpm build
```

Copy the complete contents of `dist` into the same `betteradmin` application directory described
above, then restart OpenCloud.

## Permissions and data

BetterAdmin does not introduce another authentication system or backend. It uses the active
OpenCloud session and the LibreGraph API supplied by the host. Its pages are only available to
accounts with the corresponding built-in `Account` or `Drive` read permissions.

Quota alerts follow the state returned by OpenCloud (`normal`, `nearing`, `critical`, or
`exceeded`) instead of defining independent thresholds in the extension.
