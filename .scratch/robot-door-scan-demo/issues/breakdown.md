# Robot Door Scan Demo — published issue backlog

Target: [K-a-y-C/KaKue](https://github.com/K-a-y-C/KaKue). Status: all 10 implementation issues published with ready-for-agent.
Read [../PRD.concise.md](../PRD.concise.md) first; consult the synchronized authoritative [../PRD.md](../PRD.md) only for additional explanation or ambiguity. Both preserve story numbers and specification headings. Issue numbers below are real GitHub identifiers.

| Issue | Vertical slice | Blocked by |
| --- | --- | --- |
| [#1](https://github.com/K-a-y-C/KaKue/issues/1) | Verify and prepare the supplied replacement door STEP | None — start here |
| [#2](https://github.com/K-a-y-C/KaKue/issues/2) | Verify CAD-derived robot links and scanner at home | None — start here |
| [#3](https://github.com/K-a-y-C/KaKue/issues/3) | Open the actual fixed demo scene and inspect it | [#1](https://github.com/K-a-y-C/KaKue/issues/1), [#2](https://github.com/K-a-y-C/KaKue/issues/2) |
| [#4](https://github.com/K-a-y-C/KaKue/issues/4) | Import STEP and start a fresh model session | [#3](https://github.com/K-a-y-C/KaKue/issues/3) |
| [#5](https://github.com/K-a-y-C/KaKue/issues/5) | Select ordered door surface points and inspect coordinates | [#3](https://github.com/K-a-y-C/KaKue/issues/3) |
| [#6](https://github.com/K-a-y-C/KaKue/issues/6) | Run one verified scanner visit or report a blocked pose | [#5](https://github.com/K-a-y-C/KaKue/issues/5) |
| [#7](https://github.com/K-a-y-C/KaKue/issues/7) | Preflight and visit a complete ordered route | [#6](https://github.com/K-a-y-C/KaKue/issues/6) |
| [#8](https://github.com/K-a-y-C/KaKue/issues/8) | Stop preparation or movement and preserve honest outcomes | [#7](https://github.com/K-a-y-C/KaKue/issues/7) |
| [#9](https://github.com/K-a-y-C/KaKue/issues/9) | Download consistent PLY, CSV and unchanged STEP for every outcome | [#4](https://github.com/K-a-y-C/KaKue/issues/4), [#8](https://github.com/K-a-y-C/KaKue/issues/8) |
| [#10](https://github.com/K-a-y-C/KaKue/issues/10) | Accept and deliver the complete static demonstration | [#9](https://github.com/K-a-y-C/KaKue/issues/9) |

Agents may start issues #1 and #2 independently. After both pass, proceed to #3; #4 and #5 can then proceed independently. Honor later dependencies exactly. Each issue links the concise PRD first, the full PRD as an optional reference, the agent guide and verification records and contains behavioral acceptance criteria and TDD instructions. Source CAD must be available in the agent's checkout; only text planning/research files have been published here.


The workspace has no application code to prefactor. Issues 1–2 are independently verifiable asset prerequisites; application issues 3–9 are end-to-end behavior slices, and issue 10 is the final delivery gate. Do not create separate schema, UI, worker, solver, or test-suite tickets.

Every implementation issue uses behavior-driven TDD: write one failing test through a public interface, implement the smallest complete path, repeat, then refactor while green. Favor real integration paths; mock only external boundaries. Browser workflows and independently parsed downloads are acceptance seams. Numerical checks must use independently known fixtures, not merely reproduce implementation calculations. Never write all tests before all implementation. Commit passing increments and preserve the PRD's scope.

## 1. Verify and prepare the supplied replacement door STEP

Stories: 3, 7, 38. Blocked by: none. Label: ready-for-agent.

### What to build
Verify the user-supplied replacement STEP door and prepare a reproducible asset manifest/cache so the actual door can enter the demo and later be downloaded unchanged. This is an independently verifiable asset prerequisite; no CATPart conversion is needed.

### Acceptance criteria
- [ ] Use only the replacement DOOR-of-CAR.step: 14,456,880 bytes, SHA-256 a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef. Ignore all previously supplied door files; JPGs are reference only.
- [ ] Reopen in an independent CAD reader; verify shape, actual surfaces/window opening, source units and millimeter bounding box. The initial AP214/mm header check is not full geometry validation.
- [ ] Retain unchanged original bytes and user-supplied provenance; record import/tessellation settings, source hash and any derived-cache hash. Optional GLB must derive from this exact STEP.
- [ ] Use a failing asset-validation check before accepting the artifact; verify missing/invalid assets are explicit. Never substitute another door or invent conversion history.

## 2. Verify CAD-derived robot links and scanner at home

Stories: 2, 10, 21, 37, 38. Blocked by: none. Label: ready-for-agent.

### What to build
Prepare supplied-CAD link assets and one immutable robot definition, with a verifiable articulated home-pose preview including the rigid scanner mount. Use the PRD's pinned chain and verified mesh grouping; comparison assets are not runtime substitutes.

### Acceptance criteria
- [ ] Verify source hash/import settings before using importer mesh indices; core bodies reassemble into the supplied CAD home pose, with omitted dress/fixture components documented.
- [ ] Independently verify all six joint origins, signed axes, hard intervals, flange/tool frames and scanner-emitter composition. Home flange is (968, 0, 1450) mm and emitter is (1048, 0, 1450) mm unless a documented validated replacement is necessary.
- [ ] Preserve physical dimensions, geometry hashes, source revision, joint speeds, and notices. Rendering and FK consume the same definition.
- [ ] Begin with a failing known-pose behavioral check; verify articulated poses against independent CAD measurements, not the renderer's own calculations.

## 3. Open the actual fixed demo scene and inspect it

Stories: 1, 4, 7–10, 12, 20, 36, 38. Blocked by: 1, 2. Label: ready-for-agent.

### What to build
Deliver the first static browser tracer bullet: load the actual prepared door with verified robot, scanner, shared grid and camera controls. Include the minimal application/build/test setup in this behavior slice.

### Acceptance criteria
- [ ] Actual robot/door retain scale in the right-handed robot-base frame; floor is Z=0 and the door is upright. Freeze one numeric part transform and validated home/mount in the manifest.
- [ ] Validate and record the representative five-point route and visual clearance during setup using independent tooling; runtime IK remains in later slices. Do not claim an untested placement is reachable.
- [ ] Orbit/pan/zoom change only the camera; the whole interaction fits the initial view. Missing assets and WebGL2 failure have readable outcomes.
- [ ] One failing browser loading test becomes green in both development and static production preview. Same-origin assets resolve; lockfile and reproducible commands are delivered.

## 4. Import STEP and start a fresh model session

Stories: 5–7, 35, 38. Blocked by: 3. Label: ready-for-agent.

### What to build
Let the operator replace the demo with local STEP parsed in a worker, retain unchanged source bytes, and show truthful loading/errors. Reload or replacement establishes a fresh home-pose session.

### Acceptance criteria
- [ ] Same-origin parser/WASM accepts valid STEP, normalizes units explicitly without aesthetic scaling, and applies the fixed transform. UI remains responsive.
- [ ] Enforce 50 MiB limit and show distinct readable unsupported CATPart, malformed file, no-mesh and worker/memory failure outcomes; no fabricated percentage progress.
- [ ] Preserve a complete source Blob/byte copy despite worker transfers. Clear prior selections/results, restore home, and reject stale session results.
- [ ] Use one-at-a-time browser TDD with a small known STEP fixture for accuracy/errors; actual demo acceptance still uses the supplied door. Re-test replacement clearing once selections/runs exist.

## 5. Select ordered door surface points and inspect coordinates

Stories: 13–18. Blocked by: 3. Label: ready-for-agent.

### What to build
Click visible door surfaces to append numbered markers and matching coordinate/status rows, preserving part-local and robot-base positions and approach-side normals.

### Acceptance criteria
- [ ] A stationary click adds exactly one surface hit; duplicates remain separate, append-only points. Show XYZ in robot-base millimeters to one decimal place.
- [ ] Reject drags exceeding 5 CSS pixels, multitouch, release outside canvas, non-door objects and empty window openings. Raycast only actual door geometry; no vertex snapping.
- [ ] Transform/renormalize mesh-derived normals, orient toward the selected side and retain the sign. Camera changes cannot change stored coordinates.
- [ ] Incremental browser tests cover known hits and ignored interactions; an independent rigid-transform fixture verifies coordinates within 5 mm.

## 6. Run one verified scanner visit or report a blocked pose

Stories: 19–24, 27, 28, 37. Blocked by: 5. Label: ready-for-agent.

### What to build
Complete the first motion tracer bullet from selected surface point and stand-off through worker preflight, real articulated movement, laser dwell and truthful terminal result. Reject invalid/unsolved targets before motion.

### Acceptance criteria
- [ ] Run requires loaded verified assets and a point. Stand-off defaults to 100 mm and accepts 50–300 mm; controls/selection lock during preparation/running and terminal runs cannot be rerun.
- [ ] Use p + stand-off*n, optical axis -n, deterministic roll and inverse flange-to-emitter mounting transform. Bounded six-joint DLS uses at most eight deterministic seeds and 200 iterations per seed.
- [ ] Independently recompute FK and require finite values, hard joint intervals, emitter error ≤5 mm, optical-axis and full orientation residual ≤5°. Distinguish outside_reach from pose_unsolved; no motion on failure.
- [ ] Move from home using interval-safe joint interpolation and conservative speeds including smoothstep's 1.5 peak derivative. Laser appears only for a one-second endpoint dwell; then mark visited and show Simulation complete.
- [ ] TDD prioritizes one successful visit and blocked-pose behavior. Independently check known FK/mount poses, Jacobian finite differences, singular/boundary behavior and residual rejection. No collision or controller claims.

## 7. Preflight and visit a complete ordered route

Stories: 11, 18, 25, 28. Blocked by: 6. Label: ready-for-agent.

### What to build
Extend the single-visit workflow to an immutable ordered route with full preflight before any motion, per-point status/progress, and sequential scanner visits.

### Acceptance criteria
- [ ] Solve all target poses before starting, seeded by the preceding verified pose; choose a validated low-displacement solution. One bad target blocks the whole sequence without silently skipping it.
- [ ] Preserve selection order, show current point and visited count, and mark visited only after successful dwell. Laser is off in transit/terminal states; final joints remain at the last target.
- [ ] The actual representative five-point route completes within tolerance and joint/speed bounds. Independently inspect intermediate samples and meaningful motion/laser behavior.
- [ ] Incremental tests cover route ordering, a later failed target preventing all motion, and five-point completion; screenshots alone cannot establish pose accuracy.

## 8. Stop preparation or movement and preserve honest outcomes

Stories: 26–28, 32. Blocked by: 7. Label: ready-for-agent.

### What to build
Let Stop terminate preparation, transit or dwell immediately, freeze the current robot pose, and retain every selection with truthful statuses. Handle unexpected failures without fake completion.

### Acceptance criteria
- [ ] Cancellation invalidates the run token; late worker responses and animation callbacks cannot resume or alter cancelled/replaced sessions.
- [ ] Stop disables the laser and preserves visited rows. Moving point becomes stopped, unvisited ready points become not_visited; preparation cancellation retains known diagnostics and otherwise not_visited.
- [ ] Unexpected execution errors enter failed with retained data and available downloads. Imports are disabled during preparation/running; fresh import/reload is recovery.
- [ ] Red–green tests cover Stop during preparation, transit and dwell, late response races and unexpected errors through public run/browser behavior.

## 9. Download consistent PLY, CSV and unchanged STEP for every outcome

Stories: 29–34. Blocked by: 4, 8. Label: ready-for-agent.

### What to build
Expose three explicit browser download controls in terminal states using a shared immutable snapshot of all selected surface points, normals and statuses plus retained original STEP bytes.

### Acceptance criteria
- [ ] ASCII PLY 1.0 contains only selected vertices, no faces, double XYZ/normals at six decimals, frame/units/approach-normal/source and simulated-selection metadata.
- [ ] UTF-8 rectangular CSV has every PRD column, identical surface coordinates/order to PLY, separate emitter-target coordinates, stand-off, truthful statuses/reasons and empty unattempted residuals.
- [ ] Completed, blocked, stopped and failed snapshots retain all points including problems/unvisited rows. Zero-point exports are disabled; filenames are sanitized, metadata deterministic and decimal points locale-independent.
- [ ] Download original STEP preserves the exact loaded bytes and source basename where possible. Buttons are separate user actions; object URLs are released.
- [ ] One-at-a-time browser download tests use independent PLY/CSV readers and SHA-256 input/output comparisons for bundled and imported STEP, including interrupted/blocked runs.

## 10. Accept and deliver the complete static demonstration

Stories: 36, 38; final acceptance of all stories. Blocked by: 9. Label: ready-for-agent.

### What to build
Deliver the complete actual-asset workflow as a reproducible static production build and retain evidence that the same operator behavior works in production.

### Acceptance criteria
- [ ] Production browser workflow loads actual assets, imports, selects five points, completes/stops/blocks runs, and independently validates all downloads; worker/WASM paths and MIME types work without runtime third-party CDN dependency.
- [ ] Check current desktop Chrome (Chrome-only scope recorded in README on 2026-10-05); inspect 1280×800 and 1440×900 layouts. Measure ≥30 FPS during representative run on presenter's machine, responsive worker operations and actual load/transfer sizes.
- [ ] Retain replacement door validation/dimensions/hashes, robot verification, frozen placement/home/mount, five-point residuals, browser matrix, download comparisons and performance evidence.
- [ ] Document tested development/build/preview commands, prepared static assets, pinned dependencies and applicable license/source notices. No placeholder assets or claims of physical scanning, controller compatibility or collision safety.
- [ ] Add a failing production acceptance check for each discovered regression, fix minimally and refactor green; avoid redundant implementation-mirroring tests.

## Publication

Use the skill's What to build / Acceptance criteria / Blocked by template. Include story references and TDD approach in What to build. Publish blockers first and replace draft identifiers with real issue URLs. All slices are ready-for-agent specifications whose blockers and input availability must be honored. No CATPart conversion ticket remains.

## Issue #21 — changed scan behavior

[Issue #21](https://github.com/K-a-y-C/KaKue/issues/21), blocked by landed #8, takes priority before #9. It supersedes this backlog’s historical #6/#7 requirements for 50–300 mm, laser-off transit and endpoint-only joint chords. Current requirements are 50–500 mm, continuous dense wrist-attached laser and preflighted surface-facing intermediate motion. See synchronized PRD §§7–8, technical plan and verification.
