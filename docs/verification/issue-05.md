# Issue 5 verification — 2026-10-05

## Inputs and delivery scope

SHA-256 recomputed using Python hashlib before asset work in the dedicated clean worktree:
- Door: 14,456,880 bytes; `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Robot: 34,148,428 bytes; `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.

No geometry substitution, new framework/dependency, geometry scaling or motion scope. Supplied door cache material is double-sided. Existing React/TypeScript/Vite/Three.js stack and locked Node 24 environment used.

## Incremental TDD evidence

1. Stationary actual-door skin click: RED no table (expected 2 rows, received 0); GREEN marker plus selected row in base-mm, passing 1 test. Passing increment committed `bd38467`.
2. Six CSS pixel drag: RED selected unwanted point (expected 1 header row, received 2); GREEN maximum pointer travel qualification, 2 tests passed.
3. Real Chrome two-touch input: RED unwanted selection (expected 1 row, received 2); GREEN disqualify entire gesture, 3 passed. Synthetic pointer events originally caused OrbitControls capture errors, replaced with actual CDP touch input.
4. Right-button: RED unwanted selection (expected 1 row, received 2); GREEN primary-button qualification, 4 passed.
5. Cancelled touch followed by real click: RED subsequent click lost (expected 2 rows, received 1); GREEN pointercancel/window release cleanup, passed.
6. Occlusion: RED public scene fixture selected hidden door behind foreground box (expected 0 callbacks, received 1); GREEN reject closer visible opaque non-door mesh, passed. Independent reviewer reproduced the same issue using actual CAD robot link_4; follow-up actual-GLB repro produced zero selections. Actual operator UI orbit drag (560,450)→(684,398), then click (550,550), places robot over door skin. Temporarily removing the obstruction guard made this UI test RED (expected 1 header row, received 2); guard restored immediately, and final suites exercise this same production UI path.

Existing-correct behavior regression checks were added sequentially and passed: duplicate order, one-decimal rows, unit normals with approach sign, stored coordinates after camera changes, empty window/floor/robot/scanner/empty-space rejection, outside and returning drag, cross-canvas touch, held/rejected source verification, and import preservation/clearing. These were not presented as artificial RED cycles.

## Independent numerical fixture

Public picking interface is exercised with a known triangle, no snapping: mesh vertices (0,0,0), (2,0,0), (0,2,0)m, child translation (.1,.2,.3)m, part +90° Z and translation (1,2,3)m. Center ray hits mesh (.5,.5,0), part (.6,.7,.3), base (.3,2.6,3.3)m. Explicit coordinate constants must be within 5mm. Vertex normals (0,0,2), (2,0,2), (0,2,2) interpolate at barycentric weights (.5,.25,.25) to (.5,.5,2); base rotates to (-.5,.5,2), each normalized by sqrt(4.5). Reverse-side camera retains the opposite sign. Removing normals checks geometric triangle fallback (0,0,1). Exact normal tests pass at ten decimal places. This checks child transforms, part transforms, barycentric interpolation, normalization and opposite sides independently of production math. Initial fixture imported a second Three.js instance and failed constructor identity; using the actual loaded dependency instance fixed the test harness.

The source-module fixture runs through Vite, like existing independent import checks. Production acceptance exercises actual CAD through ordinary operator UI, rather than depending on source paths.

## Reproducible checks

Put Node 24 first on PATH, then run:
```sh
npm test
npm run build
PREVIEW=1 npm test
```

Development integrated result: **36 passed, 1 intentionally skipped**, 3.1 minutes. Covers all prior scene/import regressions plus 13 selection behaviors. The skipped check is production-only same-origin worker verification.

Retained actual UI screenshots: [stationary door hit](issue-05-stationary-door.png), [1440×900 selections](issue-05-selected-1440.png), [1280×800 selections](issue-05-selected-1280.png), [actual robot occluding door after orbit](issue-05-occluded-door.png), [scrolled 1280×800 coordinate panel](issue-05-selected-scrolled-1280.png). Both default layouts and the scrolled table were visually inspected; rows remain readable in the scrollable panel.

Final TypeScript/static build passed (same-origin versioned CAD/source/parser assets verified and staged). Full static production preview: **30 passed, 7 intentionally skipped**, 2.8 minutes. Skips are source-module integration fixtures; those pass in development. Production passed actual supplied door loading/import, ordinary surface clicks, gestures/occlusion, duplicate/stable-coordinate rows, import reset/preservation, and the same-origin worker/parser/WASM/exact-source check. `git diff --check` passed.

## Limits

This issue delivers surface selection only. Runtime IK, five-point motion, stand-off, Stop and downloads are later slices. Chrome with the existing SwiftShader test configuration is the executed browser; Edge/Safari and presenter hardware performance remain final issue #10 gates. Mesh-derived normals are approximate approach-side directions, not exact analytic CAD normals. No complete-project or physical-cell acceptance is claimed.
