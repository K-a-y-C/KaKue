# Issue 8 — Stop and failure verification

Verified 2026-10-05 using installed desktop Chrome, actual supplied STEP/cache geometry and same-origin production workers. Browser acceptance is Chrome only by explicit user instruction. No geometry, dependency, joint math, placement or solver configuration changes.

## Behaviors and TDD evidence

The first public test failed waiting for the absent Stop control. It runs the actual native IK worker but holds delivery of its completed response at the external message boundary; minimal Stop invalidates the token, terminates the worker, aborts animation, retains all selections as Not visited and leaves joints at home/laser off. Releasing the queued worker response after Stop and again after a fresh real STEP import does not resume or change the replacement. Imports are disabled while preparing/running and enabled terminally. Fresh import restores manifest home and clears points/progress; terminal Run/settings/selection remain locked.

Additional public actual-door tests verify transit Stop freezes current joints, the moving row becomes Stopped and remaining Ready rows become Not visited, and Stop during the second endpoint dwell retains the first Visited row/count while extinguishing laser immediately. Transit and dwell test the implementation from the green preparation slice, without redundant production changes.

A new worker-error test failed because terminal Failed rows remained Selected. Minimal terminal status normalization retains known diagnostics/visited rows and marks unattempted rows Not visited. A scene-update error injected through the external canvas metadata setter in the second transition ends Failed, retains first Visited/second Stopped and freezes further updates.

A queued requestAnimationFrame seam test on the public `visit` interface failed because a callback delivered after cancellation wrote laser state again; a repeated completed callback also reapplied joints. The minimal settled latch removes abort listeners and makes cancelled/completed callbacks inert, including an already-aborted signal. App scene callbacks independently reject stale run tokens, and a synchronous active-run ref prevents terminal runs being reclassified by a stale Stop event. These are external animation/worker seams; tests do not inspect React internals or inject geometry/solved poses.

A final public laser metadata failure test failed with the UI permanently Running because the secondary laser-off cleanup exception prevented rejection. Minimal cleanup guards preserve the original failure while settling the promise and entering Failed with retained points and an understandable alert. Turning off the underlying Three.js laser precedes metadata publication. The test intentionally faults external rendering publication; it verifies failure settlement rather than relying on missing metadata as proof of rendered visibility.

The duplicate interrupted-status expression was extracted while green; no extra modules or dependencies were needed. Original surface points, normals, source bytes and known immutable plan are retained for #9 downloads. The worker publishes a complete preflight plan, so preparation cancellation has no partial diagnostic updates; any already established diagnostic labels are preserved.

## Exact source identities

Node `crypto.createHash('sha256')` rechecked both supplied files in this checkout:

- Door: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Robot: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.

The build stages the same eight verified CAD caches and same-origin worker/parser assets. No input substitutions or asset preprocessing changes were made.

## Reproducible checks

Node 24 LTS PATH: `/Users/kayc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`. Chrome local servers require the environment's permitted localhost execution.

```sh
npm test -- tests/browser/stop.spec.ts
npm test -- tests/browser/stop.spec.ts tests/browser/motion.spec.ts tests/browser/route.spec.ts
npm run build
PREVIEW=1 npm test -- tests/browser/stop.spec.ts tests/browser/motion.spec.ts tests/browser/route.spec.ts tests/browser/import.spec.ts tests/browser/selection.spec.ts tests/browser/scene.spec.ts
```

Before the final cleanup guard, the focused development Stop/motion/route suite passed 13 tests in 2.1 minutes; the actual five-point route completed in 30.0 seconds. The final secondary-cleanup red/green regression then passed in 11.4 seconds. Build/typecheck passed. The existing Vite large-chunk warning remains; final actual transfer size and presenter hardware FPS belong to #10.

Prior issues' tracked screenshots/JSON were restored after tests refreshed them; their historical acceptance evidence is preserved. Motion math is unchanged, so the already accepted independent robot/geometry gates are referenced through #7 instead of redundantly rewriting their evidence. #9 downloads and #10 final production export workflow/layout/presenter hardware remain necessary; no complete-project acceptance is claimed by this slice.

Final production Chrome regression: **41 passed, 10 skipped** in 5.1 minutes. The ten intentional skips are Vite source-module numerical/import/selection/animation fixtures unavailable inside the bundled production build; their development gates remain recorded. All six actual UI Stop/failure tests pass against static production, including secondary laser cleanup failure. Production actual five-point route completed in 28.8 seconds. Test wall times under software WebGL are not presenter-hardware FPS acceptance.
