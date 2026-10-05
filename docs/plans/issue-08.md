# Issue 8 technical plan

Blocker #7 is merged: immutable full-route preflight, cancellable local worker, AbortController visit, token guard, actual five-point gate and preserved original STEP already exist. Use the installed React 19.3, TypeScript 5.9, Vite 8.3 and direct Three.js stack without new dependencies. Chrome only is authorized; downloads are issue #9.

Add Stop enabled only during preparing/running. Invalidate the run token before terminating worker/aborting visit, extinguish laser, preserve current joints and selected surface points, retain visited/diagnostic rows, map moving to stopped and other unvisited rows to not_visited. Terminal runs stay locked; fresh STEP import restores home and clears selection/progress. Unexpected worker/animation errors end failed with honest unvisited rows and retained source/plan for the next download slice.

Implement sequential public-browser TDD: first Stop during actual preparation with delayed native worker delivery; then actual transit and dwell preserving prior visits; then stale animation/worker callbacks and replacement recovery; then unexpected worker/frame failures. Only external worker/event/animation seams may be injected, never React internals or substituted geometry. Keep delayed-frame dwell regression. Refactor cancellation cleanup only after behavior is green.

Run focused development Chrome tests, build/typecheck, production Stop/failure regressions and ordered motion gates. Existing geometry/IK is unchanged; preserve previous evidence artifacts from unrelated test output. Document red/green commands, asset hashes, observed contracts and limitations in README, verification and handoff. Commit locally for root review/PR/merge before #9 starts.
