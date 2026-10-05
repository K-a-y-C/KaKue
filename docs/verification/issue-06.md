# Issue 6 verification — 2026-10-05

## Scope and inputs

One selected surface point → stand-off setting → local worker preflight → real articulated movement → one-second illustrative laser dwell → Visited / Simulation complete. A failed pose produces Sequence blocked before any movement. Run accepts exactly one selection in this slice; multi-point execution belongs to issue #7. Settings/selection lock in preparing/running and terminal states. Import is locked during preparing/running, and a terminal fresh import restores the frozen demo home.

Python hashlib rechecked both actual local sources before implementation:
- Door: 14,456,880 bytes; SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Robot: 34,148,428 bytes; SHA-256 `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.

Existing React 19.3.0 / TypeScript 5.9.3 / Vite 8.3.2 / Three.js 0.186.1 dependency pins retained. Bundled Node 24.19.0 and installed Chrome with existing SwiftShader flags used. Supplied CAD and prepared GLBs are unchanged; no scaling or substitute geometry.

## TDD and review evidence

1. Actual supplied-door public UI test RED: no Run button. GREEN complete worker→articulated scene→Visited implementation. Stand-off default 100mm, active control lock and terminal rerun/selection lock verified.
2. Public numerical supplied-surface target RED: preflight module missing. GREEN mounted emitter targets, inverse flange mount, bounded DLS and independently recomputed residual gate.
3. Independent review found the dwell clock measured from planned transition duration, so a delayed frame could skip the rendered endpoint dwell. The actual UI observer was RED: only 965.3ms between laser-on/off, below the required second. GREEN starts dwell at the first endpoint frame. A simulated RAF jump to 3000ms verifies it stays active until 4000ms and cannot fake a visit.
4. Scaled rotation matrix fixture RED: clipped acos could accept a 2× matrix. GREEN strict finite orthonormal/right-handed rigid pose validation. Nonfinite matrices also reject.
5. Imported synthetic box location is blocked with unchanged home joints and laser off; this already worked and is retained as a passing regression, not an artificial RED. It supplements the actual supplied-door successful visit and does not satisfy actual demo-door acceptance on its own.

The successful actual UI test observes scene joint/emitter diagnostic attributes with MutationObserver, verifies intermediate joint changes, stationary laser endpoint, ≥990ms observed dwell, independently computes surface+normal×100mm emitter target and optical-axis residual, verifies Visited and terminal lock. Numerical fixtures also check full orientation and mount residuals.

## Independent numerical checks

- Analytic geometric Jacobian all six translation and rotation columns versus finite differences: maximum tested discrepancy below 2e-6 (meters/radians conventions retained).
- Single actual manifest surface target accepted within 5mm emitter, 5° optical axis and full orientation; flange target differs by the 80mm mounted emitter offset. Surface coordinates remain unchanged.
- Eight deterministic seeds maximum / 200 iterations maximum per seed; finite projected hard intervals; exact frozen demo home seed; least squared joint displacement selected among accepted candidates. No frozen route joint angles are supplied as solver answers.
- Conservative geometric envelope rejects an obviously distant target as outside_reach. Below-base bounded-search fixture is pose_unsolved, not proof of physical unreachability. Zero/NaN normals reject.
- Singular source-home and near hard-interval A1/A2 fixtures remain finite, accepted only after residual recomputation, and never wrap through forbidden angles.
- 1001 samples of the actual smoothstep interpolation from near all lower intervals to near all upper intervals stay bounded/finite; independently finite-differenced peak speeds stay at or below 10%-rated demo speeds. Endpoint numeric comparisons use 1e-12 tolerance; an initial bit-identical assertion failed on ordinary 2e-16 Float64 roundoff, corrected without weakening any physical bound/speed gate.
- Existing independent robot asset suite: **8 passed**, including actual source axes/flange, pinned-chain/manufacturer intervals, independent A1/A5/mount poses and all **361,773** actual supplied-core vertices reassembled with maximum **0.000030649679 mm** difference. First attempt lacked a tools-local dependency license path; an ignored temporary node_modules symlink to installed root dependencies made the full suite pass, then was removed.

## Reproduction and outcomes

Put bundled Node 24 on PATH or use an installed Node 24:

```sh
npm test
npm test -- motion.spec.ts -g 'smooth joint'
npm run build
PREVIEW=1 npm test
npm ci --prefix tools/robot-assets
npm test --prefix tools/robot-assets
```

Development full suite: **45 passed, one production-only skip, one overly exact Float64 test assertion failed**; after correcting that assertion to 1e-12, the focused interpolation regression **1 passed**. All production code and other development fixtures passed the full run. Focused motion before full regression: **3 passed**; focused numerical fixtures: **6 passed**. TypeScript plus static build passed after final implementation. Build emits the same-origin IK module worker (`preflight.worker-Bg6Oqhea.js`, 17.55kB). Existing large main-chunk warning remains (~886kB uncompressed), without build failure.

Static production preview: **32 passed, 15 intentionally skipped source-module fixtures**, 3.0 minutes. Actual supplied-door visit, blocked import, prior loading/import/selection/camera tests and same-origin source/parser/WASM checks passed. Source-module numerical fixtures pass in development and are intentionally absent from the static bundle. Retained actual endpoint screenshot: `issue-06-visit.png`; visually inspected supplied geometry, articulated endpoint and Visited row. `git diff --check` passed.

## Remaining gates

Issue #7 must prove ordered five-point actual-door runtime route. Issue #8 introduces Stop/progress and fuller terminal point status management. Downloads remain #9. The user narrowed final browser acceptance to Chrome only; Safari/Edge are not blockers. Presenter hardware ≥30FPS and complete Chrome production workflow remain #10. This slice's endpoint residuals are numerical consistency, not metrology, acquired scan data, continuous clearance, collision planning or controller safety claims.
