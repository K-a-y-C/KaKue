# Scan export, home return and platform verification — 2026-10-05

## TDD evidence

One behavior at a time, before each implementation:

1. Laser approach regression failed: expected laser off during movement from home, received on. Removed approach-frame activation; the same browser test passed and confirms continuity into point 2 and Stop cleanup.
2. Ordered-route regression failed: completed joints differed from the captured starting home vector. Added a bounded, cancellable laser-off return using the existing interpolation engine; the same actual-door test passed at the exact initial joint vector.
3. Export regression failed: legacy download UI was present. Replaced it with one successful-scan ZIP Export containing the shared PLY/CSV snapshot. Independent Python ZIP parsing validates both entries and CRCs; the same browser test passed. Five-point export independently checks order, normals, matching surface coordinates, emitter targets, visited statuses and residuals.

Stop during return, absent successful-scan export for blocked/stopped/failed runs, object-URL release, and existing numerical/selection/error regressions pass. A solid platform is visible in the [completed scan screenshot](scan-export-home-platform.png); existing non-door selection checks remain green.

## Final commands/results

- `npm run build`: passed TypeScript and static build; prepared asset hashes verified. Existing main-chunk size warning remains (~898 kB minified).
- `npm run test:numerical`: **9 passed** (independent path/pose/speed math and immutable export serializers).
- `npm run test:release`: **4 passed** (release inventory, altered/missing assets, worker/WASM/notices and deployment-base checks).
- `npm test`: **71 passed, 7 skipped** in the final full run. Skips are production-only checks and explicit hardware opt-ins.
- `npm run verify:release`: **passed**, 25 files / 41,738,209 bytes.
- `PREVIEW=1 npm test -- tests/browser/downloads.spec.ts tests/browser/scan.spec.ts tests/browser/stop.spec.ts tests/browser/delivery.spec.ts`: **19 passed, 4 skipped**. Hardware opt-ins and one development-module fixture are intentionally skipped; that fixture passes in development.
- `git diff --check`: passed.

The first full browser run had one existing worker-crash recovery assertion exceed its five-second UI deadline. Three isolated traced repeats passed; observed recovery waits were 3.1–3.9 seconds. Gave only that cold-WASM recovery assertion a bounded 15-second deadline. The final full run then passed; no parser behavior was changed or failure suppressed.

## Actual assets and outputs

Source hashes rechecked before work:

- Door: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Robot: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.

[Motion summary](scan-motion-checks.json) records actual five-point routes at 100 and 500 mm, final home joints, laser-off state and independently checked scan residuals. Both final home vectors match the starting pose. All observed joint samples stayed within hard limits; the existing independent interpolation/speed checks pass. No geometry was replaced, moved or scaled.

[Development export evidence](scan-results-development.json) and [production export evidence](scan-results-production.json) contain five CSV rows/PLY vertices and exact final home state. Independently validated ZIPs are [development](scan-results-development.zip) and [production](scan-results-production.zip); they are byte-identical (SHA-256 `3fd6f510f98c0db67a753aa275644e0a3d3b21a0abc088822b683c5a4a403b2b`). Each contains only the point cloud and coordinates. [Production network evidence](scan-production-network.json) confirms local workers/parser/WASM serving. Production layouts pass at 1280×800 and 1440×900.

The platform is 4×4 m and 180 mm thick with its top at Z=0; excluded from camera fitting and selectable door geometry. Current hardware FPS was not remeasured for this amendment. Historical presenter/geometry evidence is retained without claiming new hardware or physical-scan acceptance.

Latest main `b392d537216d0bcea3cd4e7c79fef30eab90b490` was merged cleanly and remains an ancestor of this review branch. No main push or merge is part of this handoff.
