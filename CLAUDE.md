# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server on port 3000
pnpm build            # Production build (outputs to .output/)
pnpm test             # Run tests (vitest)
pnpm check            # Auto-fix formatting + linting
pnpm lint             # ESLint only
```

TypeScript checking: `npx tsc --noEmit`

## Code Style

- No semicolons, single quotes, trailing commas everywhere (prettier config)
- Path alias: `@/*` → `./src/*`
- Strict TypeScript: noUnusedLocals, noUnusedParameters enabled
- shadcn/ui style: `base-mira`, uses `@base-ui/react`, icons from `lucide-react`
- Use `cn()` from `@/lib/utils` for conditional class merging

## Architecture

This is a geospatial client built on **TanStack Start** (file-based routing, SSR via Nitro) + **React 19** + **Tailwind v4** + **shadcn/ui**.

### Map Engine (`src/map-engine/`)

The map engine is a layered architecture where **domain types are separate from OpenLayers**. OpenLayers is a rendering target, not the data model.

**Data flow:**

```
React Hooks → MapEngine API → Zustand Store (source of truth)
                                  ↓                    ↓
                        Dexie/IndexedDB         Store subscription
                        (fire-and-forget)        triggers reconcile
                                                       ↓
                                              Layer Registry
                                              (predicate → renderer)
                                                       ↓
                                               OpenLayers Map
```

**Key modules:**

- **`types/`** — Domain types. `LayerDefinition` is a discriminated union on `kind` (`"wms" | "wfs" | "arcgis-mapserver" | "arcgis-featureserver" | "geojson" | "xyz-tile" | "vector-tile" | "wmts" | "wcs" | "group"`). `FeatureDefinition` uses GeoJSON-compatible geometries. Styles are declarative descriptors, not OL objects.

- **`registry/`** — Predicate+renderer pairs sorted by priority. `LayerRegistry.resolve(layer)` finds the first predicate match and returns its renderer. Register at priority > 0 to override built-ins. This is the extensibility mechanism — add new layer types by registering a predicate+renderer without touching core code.

- **`renderers/`** — Each renderer implements `create(layer, engine) → OlBaseLayer` and `update(olLayer, prev, next, engine) → boolean` (true = handled in-place, false = recreate). `renderers/index.ts` calls `registerBuiltinRenderers()` during engine init.

- **`engine/map-engine.ts`** — Central orchestrator. Owns the OL map instance, layer/feature CRUD, view management, and event bus. Subscribes to store changes and reconciles OL layers via the registry. Framework-agnostic (no React dependency).

- **`store/map-store.ts`** — Zustand vanilla store (`createStore` from `zustand/vanilla` with `subscribeWithSelector`). Layers stored as flat `Record<string, LayerDefinition>` with `parentId` references — tree structure is derived via selectors. Persistence is fire-and-forget to IndexedDB via Dexie.

- **`components/`** — `MapProvider` creates engine + provides via React context. `MapViewport` is the `<div>` target for OL.

- **`hooks/`** — `useMapEngine()` for imperative API, `useMapStore(selector)` for reactive state, `useLayerTree()` / `useLayer(id)` / `useFeatures(layerId)` / `useMapView()` / `useMapEvent()` for specific subscriptions.

### Routing

TanStack Router with file-based routing in `src/routes/`. Root layout in `__root.tsx`. Currently one route (`index.tsx`) rendering the map.

### UI Components

60+ shadcn/ui components in `src/components/ui/` using the base-mira style variant.
