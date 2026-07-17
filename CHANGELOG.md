# Changelog

## 2026-07-16

- Added the empty room-search results view for both room types, including consistent “Results for” headings, the next four matching days at the selected library, filter-preserving alternative-date links, and reference-matched section and button spacing using the existing USWDS system.
- Standardized room availability buttons into a full-width, responsive grid so every time slot keeps the same dimensions regardless of how many slots are available.
- Restored the AirPlay, HDMI, and whiteboard icons in room amenity tags with balanced token padding.

## 2026-07-14

- Added branch-level drill-down on both room search pages: branch names and specific-location searches now render responsive room-by-room availability with room metadata, amenities, duration-valid time links, and preserved search filters using the existing USWDS component and token system.
- Corrected generated `gap-*` token values so standard spacing utilities emit valid CSS lengths.

## 2026-06-21

- Replaced Prettier with the Oxc toolchain: formatting now runs on Oxfmt (`.oxfmtrc.jsonc`) and linting returns via Oxlint (`.oxlintrc.jsonc`) with `eslint-plugin-perfectionist` and type-aware checks through `oxlint-tsgolint`. Removed Prettier and its plugins, added `format`/`lint` scripts, and pointed the VS Code formatter and recommended extensions at the Oxc extension.
- Replicated the previous `prettier-plugin-organize-attributes` JSX attribute order (`className`, then `id`/`name`/`htmlFor`, then everything else, then `aria-*`) using `perfectionist/sort-jsx-props` with `type: "unsorted"` so authored order within each group is preserved.
- Upgraded TypeScript to the 7.0 native preview (`typescript@7.0.1-rc`), pinned across the dependency tree with a `typescript` override to avoid peer-range resolution stalls.

## 2026-02-02

- Converted routing from file-system conventions to an explicit route map using `@withsprinkles/react-router-route-map`, introducing `app/route-map.ts` and switching `app/routes.ts` to `createRoutes`, plus normalizing route names and paths around `/:roomType` and adding new `review` and `cancel` routes (`8498ba0`).
- Added the devtools JSON Vite plugin so tooling can read a devtools manifest during development (`2e57577`).
- Updated React Router future flags to the v8 keys and enabled `v8_middleware` to align the config with the latest router future flags (`aecc2f0`).
- Removed ESLint from the project, deleting config, lint task, and editor integration hints so formatting relies on Prettier instead of linting rules (`548edcf`).
- Performed major dependency upgrades, including React 19, react-uswds 11, Zod 4, Vitest 4, Vite 7, and the v2 validate-env plugin, which may impact APIs and build/test behavior (`c3887fb`).
- Rolled forward minor versions across most dependencies and devDependencies (React Router 7.13, Mapbox GL 3.18, TypeScript 5.9, etc.), plus set the Node engine floor to `>=24.0.0` (`2d510b7`).
- Bumped the project’s `.nvmrc` from Node `v22.3.0` to `v24` to match the new engine baseline (`6468d0f`).
