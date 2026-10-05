# Issue 21 — continuous surface-facing scan

## Scope and framework

Build on landed #8 (main a338b50). Keep the locked React 19.3 / TypeScript 5.9 / Vite 8.3 / direct Three.js 0.186 stack, local IK/STEP workers, same-origin assets, and Playwright/desktop Chrome. No new dependency or backend. Issue #21 explicitly supersedes the old laser/transition/stand-off requirements; implement before #9. Preserve supplied geometry, selection order, point coordinates, terminal statuses, cancellation tokens and source bytes.

## Technical design

Keep `preflight(points, standOffMm)` as the small public planning interface. Extend each PlannedPoint with a sequence of verified joint waypoints and their durations. Home-to-first uses bounded joint interpolation and establishes stand-off only on arrival. For later segments, linearly interpolate selected surface positions and shortest-arc interpolate emitter orientation (deterministic endpoint roll); optical normal is minus the interpolated emitter Z axis. Reject ambiguous antipodal normal routes. Targets use the requested stand-off and inverse emitter mount. Solve intermediate targets seeded by the previous accepted pose. Validate the actual joint interpolant against Cartesian target position/full orientation/optical axis at intermediate fractions; subdivide until within conservative tolerances or block with a readable transition reason. Verify finite values, hard intervals and smoothstep peak speed before any motion. This is a selected-point polyline, not surface reconstruction or coverage planning.

Execution consumes the preflighted path without runtime IK. Keep one-second accepted endpoint dwells and truthful post-dwell Visited status. Laser activates with the first approach frame, stays on through all segments/dwells, and is explicitly off at completion, Stop and failures. Existing abort/settled/token safeguards remain. Three.js fan follows actual wrist/tool transform; final patch width 240 mm (twice the initial 120 mm reference, widened after near-view inspection), a filled red sheet plus 61 dense ribs, axial length equal to requested stand-off (off-axis rays longer). Range is inclusive 50–500 mm, default 100 mm; UI and planner agree, never clamp silently.

## TDD sequence and checks

One failing public behavior test, minimal implementation, then next behavior; refactor only green:

1. Actual two-point Run lights the laser during approach and keeps it on across the second transition; Stop extinguishes/freezes it.
2. A known planar route has surface-facing intermediate motion at requested stand-off, bounded angles/speeds, and accepted endpoints. Test the public planner and execution with independently calculated pose checks.
3. UI and planner accept 500 mm, reject nonfinite/out-of-range values, and render fan reach/width at near/far distances.
4. Invalid intermediate/antipodal transition blocks the entire route before laser/motion; Stop during preparation/transit retains #8 semantics and rejects late callbacks.
5. Actual supplied five-point route in dev and static production: independent intermediate residuals/endpoint checks, speed/joint bounds, laser continuity and Stop. Retain fan screenshots; investigate any regression before claiming acceptance.

Verify both source hashes before asset work. Run typecheck/build and relevant existing regression suites, preserving historical evidence. Synchronize both PRDs, guide, README, verification record and handoff. Commit passing increments locally; publish only `codex/issue-21-continuous-scan` and raise a review PR. Do not merge or close with unverified gates. #9 exports and #10 whole-demo acceptance remain outside this slice.
