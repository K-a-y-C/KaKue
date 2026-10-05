# Issue 21 — continuous surface-facing scan verification

Source identities rechecked in the isolated checkout on 2026-10-05:

- Door: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Robot: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.

Eight actual CAD caches and the genuine bundled STEP are rehashed/staged by every build. Geometry, placement, emitter mount, joint definition and dependencies are unchanged. Chrome uses software WebGL in this environment; these timings are not presenter hardware FPS evidence.

## Behavior and TDD record

1. Actual two-point Run failed because the laser was false during first approach. Minimal run-continuous activation now keeps it true across approach, transitions and dwells. Completion/Stop/error extinguish it; abort/settled/token protections remain.
2. Public preflight planar fixture failed because there was no intermediate path. Add bounded, adaptive IK waypoints and validation of the exact smoothstep joint interpolant, including conservative error bounds between the 17 samples per segment. Independent Three.js FK composes measured CAD origins/signed axes rather than calling production FK.
3. Public execution of the known planar fixture initially drifted **36.379 mm** when executing only the endpoint joint chord. Consuming the preflighted waypoint durations/angles passes ≤5 mm/≤5°; no runtime IK or independently aimed beam hides the articulated pose.
4. UI rejected 500 mm and planner threw its old 300 mm range error. Inclusive 50–500 mm now works in both; invalid/empty/nonfinite values are rejected. Fan is a 240 mm filled sheet (opacity 0.28) plus 61 rays (opacity 0.65), axial reach equals actual stand-off, off-axis rays longer. Geometry-derived metadata and accepted-pose screenshots verify near/far presentation.
5. Both endpoints of an opposite-normal fixture solve alone; their combined path initially returned only a subdivision-budget error. Explicit antipodal rejection now supplies a readable point diagnostic before any movement. Unsolved later endpoints retain existing whole-route blocking and no false laser activation.
6. Plan snapshot fixture failed because stand-off was absent and points were retained by reference. RunPlan now retains `standOffMm` and copies selected points; execution uses that recorded value. Original surface coordinates, endpoint targets/residuals and source bytes stay available for #9; waypoints do not become selections or exports.

Existing Stop tests verify preparation cancellation/native late delivery, approach freeze, second endpoint dwell retention, render/worker/laser failures and queued animation callbacks. Tests now expect continuous transit laser and detect dwell by stable endpoint joints. Whole-route tests compare every published pose against independent FK and each executed joint chord against its planned surface-facing emitter pose. One-second endpoint visits and selection order remain truthful.

## Numerical actual-route evidence

`npm run test:numerical` samples the supplied five-point route at 101 fractions per joint subsegment, at 100 and 500 mm. [Raw plans and numerical results](issue-21-numerical-route.json) retain endpoints, intermediate target/actual acceptance bounds and durations.

| Stand-off | Maximum sampled position error | Maximum full orientation error | Peak/demo speed ratio | Scan subsegments (excluding approach) |
| --- | --- | --- | --- | --- |
| 100 mm | 0.075590 mm | 0.071265° | 1.0000000000000002 (roundoff) | 368 |
| 500 mm | 0.122764 mm | 0.070382° | 1.0000000000000002 (roundoff) | 461 |

Angles stay finite inside all hard intervals. Each accepted subsegment additionally stores a conservative ≤5 mm/≤5° bound for the continuous interpolant, not just its samples. The home approach validates finite hard-interval motion/speeds but establishes stand-off only on first arrival. The selected-point polyline and shortest-arc normal/orientation field do not reconstruct the actual curved CAD surface between selections; this is a documented simulation policy, not a clearance or coverage guarantee.

## Commands and acceptance

```sh
npm run test:numerical
npm test -- tests/browser/scan.spec.ts tests/browser/route.spec.ts tests/browser/motion.spec.ts tests/browser/stop.spec.ts
npm test -- tests/browser/route.spec.ts tests/browser/scan.spec.ts tests/browser/kinematics.spec.ts
npm run build
PREVIEW=1 npm test
```

Focused development regressions: 16 passed before expanded near/far/five-point tests. Build/typecheck passed; existing large main-chunk warning remains (about 888 kB raw / 241 kB gzip; preflight worker about 103 kB). One expanded dev run was interrupted by a source edit triggering Vite reload; rerun with fixed source is required, not claimed passing. Final core checks: **6 numerical tests passed**, **45 full static-production Chrome regressions passed / 16 intentional source-only skips**, and both independently checked development five-point scans passed at 100 and 500 mm. The final 240 mm geometry refinement subsequently passed all 3 development fan/continuity tests and a fresh build/typecheck; its production recheck is recorded below.

No reference screenshot was supplied; no exact screenshot match claimed. Screenshots establish appearance; independent pose checks establish numerical accuracy. Safari/Edge and presenter FPS remain #10 final-demo gates; #9 downloads are deliberately outside this slice.

Visual refinement: the initial 120 mm reference patch was hard to see at 50 mm stand-off. A new public 240 mm width assertion failed against 120 mm; the minimal geometry widening doubles the reference patch to **240 mm** while retaining 61 rays, opacity, rigid emitter attachment and exact axial reach. This also exceeds the old renderer’s 180 mm triangle width. Final fan and transition images are refreshed after this change; motion math and waypoint plans are unchanged.

## Browser pose evidence

Development actual-route FK checks: at 100 mm, maximum sampled scan position error 0.075590 mm and full orientation error 0.069734°; at 500 mm, 0.115480 mm and 0.067949°. Published emitter transforms agreed with independent FK within 2.3e-16 matrix element error. [100 mm samples](issue-21-browser-route-100.json) and [500 mm samples](issue-21-browser-route-500.json) record every observed frame, laser state, point progress and statuses. Production equivalents are [100 mm](issue-21-browser-route-100-production.json) and [500 mm](issue-21-browser-route-500-production.json).

Final visual views: [50 mm development](issue-21-fan-50.png), [500 mm development](issue-21-fan-500.png), [50 mm production](issue-21-fan-50-production.png), [500 mm production](issue-21-fan-500-production.png), and in-transit production views at [100 mm](issue-21-motion-100-production.png) and [500 mm](issue-21-motion-500-production.png). The fan stays rigidly attached; its sheet can appear edge-on as the actual scanner turns with curved normals. The near view is short because the physical stand-off is 50 mm; it is not lengthened independently to exaggerate the beam.

Original #6/#7 screenshots/records remain historical evidence and were restored after regression tests. #21 images show this slice.

Final 240 mm production refinement: **7 passed** (2.6 minutes), covering both actual five-point routes, continuous laser/Stop, whole-route blocking, and near/far width/reach checks. Final development fan checks: **3 passed**. Final build/typecheck passed. The full 45-pass/16-skip production suite preceded the geometry-only widening; the focused final suite verifies the changed geometry and the actual route again. Motion/solver/source behavior was not changed by that visual refinement.

Final production 100 mm route: maximum sampled scan position error 0.075590 mm, full orientation error 0.069694°, independent/published FK element discrepancy 2.22e-16; 98 observed frames.

Final production 500 mm route: maximum sampled scan position error 0.093552 mm, full orientation error 0.067820°, independent/published FK element discrepancy 2.22e-16; 80 observed frames.
