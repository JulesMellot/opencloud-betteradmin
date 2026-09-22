# Changelog

All notable changes to BetterAdmin are documented in this file.

## 0.1.4 - 2026-09-22

### Fixed

- Load personal drives explicitly and associate them with users by owner ID when `$expand=drive` omits them.
- Keep the user list available if personal-drive enrichment is not permitted by the server.

## 0.1.3 - 2026-09-22

### Fixed

- Display unrestricted remaining capacity as `Unrestricted` instead of OpenCloud's maximum-integer sentinel value.
- Avoid duplicate infinity and missing-quota markers next to adjacent table columns.
- Display missing personal-drive usage as unavailable instead of zero bytes.

## 0.1.2 - 2026-09-22

### Fixed

- Render custom user and space table cells by declaring their `OcTable` fields as slots.
- Restore avatars, quota bars, storage values, remaining capacity, and status indicators in production.

## 0.1.1 - 2026-09-22

### Fixed

- Keep uninitialized user quotas neutral instead of displaying a red progress bar.
- Load users and spaces independently according to the administrator's permissions.
- Preserve previously loaded data when a refresh fails.
- Exclude unlimited drives from the known-quota percentage numerator and denominator.
- Use native empty-state icons that do not depend on missing extension assets.
- Sort storage pressure by the uncapped usage ratio.

### Improved

- Share cached data between BetterAdmin views and avoid unrelated API requests.
- Add sortable, paginated user and space tables with a default page size of 50.
- Add proper singular and plural labels.
- Expand unit coverage for failed refreshes, quota aggregation, over-quota sorting, and missing quotas.

## 0.1.0 - 2026-09-22

### Added

- Native BetterAdmin entry in the OpenCloud administration sidebar.
- Storage overview covering personal drives and project spaces.
- Searchable user and space quota tables.
- Quota alerts based on the state reported by the OpenCloud API.
- French translations and theme-aware OpenCloud Design System components.
- Docker Compose development environment and production installation instructions.
