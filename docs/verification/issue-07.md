# Issue 7 — ordered route verification

Verified 2026-10-05 against the actual supplied CAD, React/TypeScript/Vite static application and installed Chrome. User amended browser acceptance to Chrome only (see orchestration plan). This slice completes ordered route preparation/playback; Stop, downloads and final presenter-hardware acceptance remain later issues.

## Delivered behavior and TDD

First public two-point test failed because Run was disabled for multiple selections. Minimal implementation removes that restriction and iterates the immutable preflight answers in selection order from preceding joints. The passing behavior observes Current point, Visited count and per-row status, then verifies terminal laser-off and final-pose retention. A second actual-door two-point test failed because an earlier solved point remained Ready after a later target failed. The minimal fix maps valid rows to Not visited when the whole preflight blocks. A mutation recorder verifies no joint change or laser activation at any time during this blocked route. The failed later target is an actual surface click at (780,500), not a synthetic replacement or proof of physical unreachability.

The five-point acceptance clicks the actual door at independently projected fractional screen locations in the frozen order: (681.160927,480.122642), (681.219904,506.444347), (680.244766,523.942241), (761.506759,575.148953), (764.290822,528.705958). Each selected table surface coordinate agrees with its independent frozen surface within 0.15mm. No runtime points or solved angles are injected. Browser mutation records retain the precise selected surface coordinates/normals, observed joint angles/emitter matrices and UI statuses. Each laser-on interval keeps fixed joints for a full one-second dwell; its row remains Moving until the dwell completes. Exactly five ordered dwell intervals complete, all rows become Visited, visited count reaches five, laser is off and final joints persist. Recorded angles stay within independent manufacturer intervals.

A short-dwell polling assertion in the initial two-point test was replaced with event recording in the full route gate: polling can first observe a later dwell. This changed test observation, not production dwell timing. A later real single-point motion regression recorded a 986.8ms laser interval: requestAnimationFrame timestamps precede expensive FK/render frame work, so starting dwell from that timestamp can undershoot actual activation. The failing public test led to a minimal execution fix: activate laser, then start dwell at max(frame timestamp, performance.now()). This preserves delayed-frame deterministic behavior and guarantees the full real activation interval.

## Numerical and actual geometry gate

[Independent runtime route reconciliation](issue-07-runtime-route.md) rehashes exact STEP/cache inputs, solves only frozen surface targets afresh, independently recalculates emitter position/full orientation/axis residuals and inspects intermediate joint intervals, conservative peak speeds and actual mesh samples. Maximum frozen-route position error is 0.033560mm and full orientation error 0.049926°. The runtime low-displacement wrist branch differs from earlier setup answers, so prior setup clearance alone was insufficient. Fresh runtime answers pass all 101 sampled actual-mesh contact/floor checks. Browser-observed answers receive a separate independent check against precise clicked points and rendered emitter matrices.

Door SHA-256: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`; robot SHA-256: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`. No source geometry, dimensions, placement, dependency or joint definition changed.

## Commands and results

With Node 24 LTS on PATH:

```sh
npm test -- tests/browser/route.spec.ts tests/browser/kinematics.spec.ts tests/browser/motion.spec.ts
npm run build
PREVIEW=1 npm test
node scripts/verify-runtime-route.mjs
node scripts/verify-runtime-route-clicks.mjs
```

The independent Python gate and environment reproduction are in the linked runtime reconciliation record. Initial development focused route tests: 3 passed, including actual five-point completion in 37.4 seconds under software WebGL. After the real dwell-clock correction, the combined development route/kinematics/motion gate passed **13 tests** in 1.2 minutes; the five-point route completed in 28.6 seconds. Build/typecheck: passed, same-origin production IK worker emitted. Complete production Chrome suite: **35 passed, 15 skipped** in 3.9 minutes. Skips are deliberate Vite source-module numerical/import/selection fixtures unavailable in the production bundle; actual production controls/import/route behavior runs. Production five-point route completed in 28.2 seconds under software WebGL. These test wall times are not presenter-hardware performance/FPS acceptance.

Evidence: [development route screenshot](issue-07-route.png), [production route screenshot](issue-07-route-production.png), [precise production browser motion record](issue-07-browser-route-production.json), fresh runtime plan and independent geometry JSON records. Screenshots establish presentation only; numeric records/tests establish tolerances.

Finite 21-fraction path sampling is not continuous collision detection or physical-cell safety. No arbitrary imported-part or every-surface solver guarantee is claimed. #8 Stop, #9 downloads and #10 final workflow/layout/presenter hardware remain required.

The independent production-browser reconciliation checks all 82 observed motion samples: finite bounded joints and independently calculated emitter matrices agree to 4.44e−16 per matrix component. Actual selected surface positions differ from frozen references by at most 0.000285mm. The observed runtime solutions differ slightly from directly solved frozen points (maximum 0.000138rad); their own full endpoint and 101-sample actual mesh path checks pass. See [production observed-motion gate](issue-07-runtime-route-browser-production-clearance.json).

The independent supplied-robot suite (`npm test --prefix tools/robot-assets`) passes **8 tests** after provisioning its isolated locked tool dependencies with `npm ci --prefix tools/robot-assets --offline`. Its initial run had one environment error (missing isolated importer license path); no geometry substitute or source change was made. Fresh source tessellation reassembles all 361,773 core vertices with maximum 0.000030650mm discrepancy and independently rechecks CAD axes/flange, source signs, limits and speeds.

Verification scheduling correction: one focused development run had 12 passing tests but its final route was interrupted when concurrent robot asset preparation rewrote the deterministic imported manifests and Vite reloaded the page (status returned to Scene ready). Production acceptance had already passed and is unaffected. The development gate was rerun serially after preparation completed; avoid asset preparation writes while a Vite route test is running.

Final production motion/route rerun after the dwell-clock fix: **5 passed, 2 skipped** in 1.4 minutes. Both the original single-visit real dwell gate and the tightened five-point real dwell gate (≥990ms observed timestamps, allowing recorder scheduling delay) pass. Final production route wall time was 29.8 seconds. No import/selection code changed after the earlier complete production suite; only the tested dwell-clock line changed.
