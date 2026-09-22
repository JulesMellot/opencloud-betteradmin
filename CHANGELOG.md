# Changelog

All notable changes to BetterAdmin are documented in this file.

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
