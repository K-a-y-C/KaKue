# Implementing the Robot Door Scan Demo

Read the [concise PRD](../../.scratch/robot-door-scan-demo/PRD.concise.md) first; consult the synchronized [full PRD](../../.scratch/robot-door-scan-demo/PRD.md) only for additional explanation or ambiguity. Story numbers and specification headings are preserved. Also read your issue, its blockers, the [backlog](../../.scratch/robot-door-scan-demo/issues/breakdown.md), and [robot verification](../research/robot-verification.md) before changing code. Product decisions, domain vocabulary, six-joint constants, scanner mounting, CSV schema, and state transitions are specified in the PRD. This guide supplies working context; it does not replace that specification.

## Intended result

A desktop browser app shows one actual articulated six-axis robot and one fixed automotive door, lets the presenter append surface points, preflights all scanner target poses, visits them in selection order with a continuous dense red laser fan, and exports PLY/CSV plus unchanged STEP. This is a simulation with truthful completed, blocked, stopped and failed outcomes. There is no backend, database, persistence, account, physical scanning, controller connection or collision planning.

The app is React + TypeScript + Vite with direct Three.js. STEP parsing and bounded numerical IK use local workers. Same-origin versioned parser/WASM assets must resolve in the production build. The PRD's dependency table is a research baseline, not an installed/verified lockfile. Verify compatible available versions when installing and record any justified change. Do not build future features ahead of your ticket.

## Authoritative input assets

| Input | Location in the supplied workspace | SHA-256 |
| --- | --- | --- |
| Door | `3d files/car-front-door-1/DOOR-of-CAR.step` | `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef` |
| Robot | `3d files/Robot/KR22_R1610-KR16_R1610.stp` | `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1` |

Ignore every older door input. No CATPart conversion is required. Folder JPGs are references, not geometry. The replacement door header declares AP214/millimeters and its size is 14,456,880 bytes; actual bounds/topology/accuracy still need independent verification. Recompute input hashes before preparing assets. Raw CAD is currently supplied locally; check availability in your checkout before starting asset-dependent work. If missing, report the exact required input and wait for provisioning; do not download a similarly named replacement or fabricate assets.

Render robot primary bodies derived from its supplied STEP. Use the pinned verified joint chain and core grouping, not an unrelated rig or excluded OPW file. One immutable RobotDefinition feeds both rendering and FK/IK. Retain source provenance and applicable notices.

## Stable conventions and boundaries

- Right-handed robot-base frame: +Z up, +X toward the door; floor Z=0. Internal distances are meters, angles radians; UI and exports use millimeters. Never scale a model to fit.
- Surface points and approach-side unit normals are primary selection data. Scanner target is `p + stand_off*n`, facing `-n`; flange target must account for the emitter mount. Surface coordinates are never replaced by emitter/flange coordinates in exports.
- Home is `(0°, -90°, +90°, 0°, 0°, 0°)` unless a validated replacement is recorded. Default stand-off is 100 mm, allowed 50–500 mm. Accept poses only within hard joint bounds and independently recomputed ≤5 mm/≤5° residuals.
- Session states: loading → selecting → preparing → running → completed; blocked/stopped/failed are truthful terminal alternatives. Selection, import and settings lock during preparation/running. Terminal runs do not rerun; fresh import/reload starts again.
- Public contracts: PartAsset, RobotDefinition, SelectedPoint, RunPlan, RunState and DownloadSnapshot as defined in the PRD. Keep related complexity behind small cohesive interfaces; internal helpers are not public APIs. Use Float64 for motion math.
- Preserve source bytes before worker transfer. Cancelled/replaced sessions reject stale callbacks. All selected points survive terminal outcomes and use one immutable download snapshot.
- Points are append-only; no delete/reorder/undo, pause/reset, user placement controls, arbitrary robot selection or automatic route planning.

## Continuous scan — issue #21 requirement change

Issue #21 supersedes endpoint-only laser activation and joint chords from #6–#7; complete it before #9. Preflight endpoints and every executed scan interpolant. Use a surface-position polyline, shortest-arc full emitter orientation and its interpolated normal offset; reject antipodal normals. Keep actual wrist-attached laser on from first approach through all transitions/dwells, off terminally and on Stop. Home approach establishes stand-off on arrival. Validate intermediate poses plus between-sample error bounds, finite hard intervals and smoothstep peak speeds. The user's final 2026-10-05 amendment replaces the flat sheet with an 80×60 mm aperture, four translucent side walls, 117 rays and a filled 240×180 mm rectangular end, retaining actual 50–500 mm axial stand-off. See [laser-volume plan](../plans/laser-volume.md). Original SelectedPoint/source identity and endpoint data remain available for the immutable #9 snapshot; waypoint samples are simulation planning data, never extra selected/export points. See [technical plan](../plans/issue-21.md).

## Working one issue at a time

1. Confirm blockers have landed and inspect their actual deliverables. A closed ticket alone is not proof that your needed contract or verified asset exists.
2. Identify your smallest complete public behavior and the important failure cases from the ticket. Include UI, worker/scene, state and tests needed for that behavior in the same slice.
3. Write ONE failing behavior test; implement just enough to pass; repeat. Refactor only while green. Never write all tests and then all implementation.
4. Prefer real integration seams: browser interactions, actual file import, public run controls and independently parsed downloads. Mock external boundaries only where necessary. Do not assert private helpers or duplicate production math as the expected answer.
5. Independently known geometry fixtures supplement browser tests: known FK poses, frame transformations, Jacobian finite differences, hard-limit/peak-speed checks, emitter mounting and residual checks. Synthetic STEP fixtures test errors/accuracy; only the actual supplied door satisfies demo acceptance.
6. Keep the slice demoable. Do not mark it blocked merely because later-ticket features are absent; do not silently implement the rest of the backlog. Add regression tests for discovered behavior faults.
7. Run checks appropriate to the slice in development and production preview. Document commands, outcomes, asset hashes/evidence and any genuinely unresolved acceptance item. Keep README run instructions synchronized when scripts are introduced.
8. Provide a concise handoff: behavior delivered, public contracts/evidence, tests run, remaining limitations and next unblocked tickets. Commit passing increments. Never close your ticket with failed or unverified mandatory acceptance criteria.

Source assets and numeric verification are prerequisites, not a request to build horizontal application layers. There is no existing code to prefactor initially. Issue 3 introduces application/test scaffolding as part of the actual scene-loading tracer bullet. Issue 7 proves and freezes the accepted five-point route against the runtime solver; issue 10 verifies the full production workflow on the target browsers and presenter hardware. Earlier scene placement checks must be recorded honestly and reconciled with that runtime gate.

## Import-first branding — final user amendment

Start with the provided KaKue Automation logo and import screen. No scene/scan controls/CAD requests before the user selects a valid STEP. Initialize the workspace with the actual selected source: exact hash-matching supplied CAD may use its accepted cache, all other STEP uses the parser worker. Retain the user's original File/name, never replace it with bundled bytes. Reload returns to the import screen. Shared browser scan fixtures now explicitly import the supplied file before exercising the unchanged motion/export gates. See [plan](../plans/import-first-workspace.md).
