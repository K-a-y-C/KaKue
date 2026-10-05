# Robot Door Scan Demo — Product Requirements Document

Status: ready-for-agent · Source version: 1.4 (2026-10-05) · Owner: Kakue

Concise companion to [PRD.md](PRD.md), which is authoritative and synchronized for issue #21. Read this file first; consult the full PRD only for additional explanation or ambiguity. Story numbers and specification headings retain the original mapping. Keep both documents synchronized when requirements change; resolve conflicts against the full PRD and correct this companion. Supplied-robot pivots/core correspondence are checked; replacement-door validation and runtime asset preparation remain acceptance gates. Ready-for-agent means specified, not accepted or unblocked.

## Problem Statement

Demonstrate robot scan planning in a desktop browser: show the actual supplied door and articulated six-axis robot, select surface locations, simulate ordered scanner visits, and export coordinates. Accuracy is ±5 mm relative to imported CAD. Prioritize reliable interaction, joint-constrained motion, truthful outcomes, and valid files. No hardware connection, measurements, reconstruction, or production robot program.

## Solution

One fixed robot and upright door share a grid floor; a rigid wrist scanner displays an illustrative red laser fan without acquiring data. Load the prepared door or import STEP → orbit/pan/zoom → append numbered surface points → set stand-off → Run preflights every pose → move from home in selection order with a continuous surface-facing laser scan if all pass → show progress and truthful terminal outcome → separately download PLY, CSV and unchanged loaded STEP. Fresh import/reload starts over. Placement and dimensions are fixed; no fixtures, tables, placement/scale/robot-selection controls, point editing, pause or reset.

### Success criteria

- The supplied robot and supplied replacement STEP door are recognizable and retain their original physical dimensions.
- Robot link geometry, joint frames, flange, and limits pass the independent verification gate.
- Surface clicks create numbered points at the clicked surface locations. Orbit drags and clicks on other scene objects do not create points.
- A representative five-point route on the visible door skin solves and plays completely without violating joint limits.
- The scanner emitter arrives within 5 mm of each target stand-off position; its viewing axis is within 5° of the intended surface-facing direction.
- PLY and CSV contain exactly the same selected surface points in the same order, in robot-base coordinates expressed in millimeters.
- Downloaded STEP bytes match the actual imported or bundled supplied STEP bytes exactly.
- Stop ends the run, freezes the current robot pose, and preserves honest point statuses and exports.
- The delivered static production build performs the same workflow as the development build.

## User Stories

Original IDs are preserved for GitHub issue references; each row states the actor, required behavior, and purpose.

1. Presenter: show robot and door after demo load; make the purpose clear.
2. Presenter: use actual supplied robot geometry; represent the intended machine.
3. Presenter: use supplied door geometry; demonstrate the chosen part.
4. Presenter: bundle the prepared door; avoid repeated local-file navigation.
5. Operator: import STEP; demonstrate loading rather than a hardcoded mesh.
6. Operator: show honest loading/readable import errors; identify readiness/failure.
7. Operator: preserve CAD dimensions; maintain compatible robot/door sizes.
8. Presenter: predefined door position; consistent scene without setup manipulation.
9. Viewer: shared grid floor; understand relative locations.
10. Viewer: wrist scanner box; understand the carried device.
11. Viewer: continuous dense red laser fan; explain the scanning concept.
12. Operator: orbit/pan/zoom; inspect and select surfaces.
13. Operator: click any visible door surface; choose locations without typing coordinates.
14. Operator: numbered marker per click; reveal scan order.
15. Operator: matching XYZ point list; confirm exported selections.
16. Operator: distinguish camera drags from clicks; avoid unwanted points.
17. Operator: ignore floor/robot/scanner/laser/empty-window clicks; select only real part surfaces.
18. Operator: visit in selection order; predictable behavior.
19. Presenter: one Run control; start the complete sequence easily.
20. Presenter: predefined starting home; repeatable fresh demonstrations.
21. Viewer: real joint rotations; resemble a CAD assembly/physical robot.
22. Viewer: scanner faces each point at stand-off; explain scanning action.
23. Operator: set stand-off before Run; demonstrate scanner distance.
24. Operator: identify unreachable/unsolved poses; avoid impossible-movement claims.
25. Presenter: current-point indicator and completed count; follow progress.
26. Presenter: Stop terminates sequence; end an unsuitable demonstration.
27. Operator: lock selection/settings during runs; prevent changing active sequences.
28. Operator: distinguish completed/stopped/blocked; truthful results.
29. Operator: selected-points-only PLY; open locations in another 3D tool.
30. Operator: CSV coordinates/normals/order/status; interpret selections elsewhere.
31. Operator: identify export units/frame; unambiguous values.
32. Operator: retain stopped/failed/unvisited selections in exports; no silent data loss.
33. Presenter: download the same loaded STEP; demonstrate a third download without reconstruction claims.
34. Operator: ordinary browser downloads; no special viewer account/export service.
35. Operator: fresh session after reload/import; start over without editing controls.
36. Presenter: laptop/desktop browser interface; ordinary presentation equipment.
37. Developer: shared verified robot definition for rendering/motion; consistent visuals/kinematics.
38. Developer: record provenance/dependency versions; reproducible, validated delivery.

## Implementation Decisions

### 1. Final MVP boundaries

One fixed robot/demo part. Generic STEP import uses the same predefined transform; arbitrary-part compatibility and automatic placement are not guaranteed. Never scale geometry to fit; camera changes only the view. Selections are append-only; duplicate clicks remain distinct. No delete/reorder/undo/pause/reset/return-home-after-run/trajectory editing/route optimization. Only conservative reach screening, IK residuals and hard joint intervals are checked. Visually validate placement and the acceptance route during asset setup; this does not establish physical-cell safety.

### 2. Selected technology stack

Client-side React/TypeScript/Vite with direct Three.js. React owns controls/session and creates/disposes the imperative scene; animate transforms directly without React rerenders per frame.

| Dependency | Research baseline | Responsibility |
| --- | --- | --- |
| React and React DOM | 19.3.0 | Interface and session state |
| Vite | 8.3.2 | Development server and static build |
| Vite React plugin | 6.1.1 | React build integration |
| TypeScript | 5.9.3 | Typed application/worker contracts |
| Three.js | 0.186.1 | WebGL2 rendering, camera, rigid links, picking, GLB assets |
| Three.js types | 0.186.0 | Corresponding type definitions |
| occt-import-js | 0.0.23 | STEP tessellation in a worker |
| Playwright Test | 1.63.0 | Browser acceptance and downloads |

Pins were researched on 2026-10-04, not installed/integration-tested. Verify compatible versions, commit a lockfile, and validate production. Use Node 24 LTS; researched Vite support includes Node ≥22.12. Use ordinary CSS, React state, Web Workers, File/Blob APIs and a small local six-joint module. No UI framework, React Three Fiber, runtime ROS/URDF/Xacro parser, physics engine, Next.js/SSR, backend/account/database/cloud conversion/controller is required.

Versioned same-origin parser JS/WASM, explicit WASM URL and correct MIME type must work in production. No runtime third-party CDN. Ordinary workers avoid SharedArrayBuffer/cross-origin isolation.

### 3. Asset preparation and mandatory verification gates

#### Door gate

Sole source: `3d files/car-front-door-1/DOOR-of-CAR.step`, user-supplied 2026-10-04; 14,456,880 bytes; SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`. Initial inspection found ISO-10303-21 opening/closing markers, AP214 AUTOMOTIVE_DESIGN and millimeters; it does not prove parsing, bounds, topology or picking accuracy. Ignore all older doors/CATPart; no conversion remains. JPGs are references only.

Independently reopen STEP in a CAD reader; verify recognizable shape, actual selectable surfaces/window opening, and millimeter bounding box. Preserve complete bytes. Optional GLB startup cache must derive from this STEP and retain settings/provenance/hashes; preview meshes/JPGs do not satisfy import/download acceptance. Missing/invalid geometry is explicit; never substitute older/image-derived geometry or invent conversion history. Browser CATPart import is excluded.

#### Robot gate

Source: `3d files/Robot/KR22_R1610-KR16_R1610.stp`, SHA-256 `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`. Flattened AP214, one product, 73 BREP solids, no occurrence hierarchy or six-link constraints. Independently extracted cylinders/flange plane match the original KR 16 R1610 chain from ROS-Industrial PR #146, pinned `07b45e70914e2eb653215de7f95d7e665de9b867`; actual tessellation confirms main-body correspondence. This unmerged community contribution is not an official KUKA release or the newer KR 16 R1610-2.

Derive every primary runtime body from supplied STEP. Reference DAE meshes are comparisons only: they omit accessories and differ locally. Verified grouping uses occt-import-js 0.0.23, millimeters, 1 mm absolute/0.25 rad angular deflection. Indices are importer mesh-array indices, not STEP entity IDs. Each core mesh: 100 deterministic area-weighted surface samples compared against every reference link by exact closest-triangle distance.

| Supplied STEP mesh indices | Runtime rigid link | Largest sampled correspondence error |
| --- | --- | --- |
| 73 | Fixed base | 1.703 mm |
| 8 | Link 1 | 0.742 mm |
| 6, 7 | Link 2 | 1.424 mm |
| 0, 1, 2 | Link 3 | 0.732 mm |
| 5 | Link 4 | 0.663 mm |
| 4 | Link 5 | 0.668 mm |
| 3 | Link 6 / flange | 0.768 mm |

Extract these groups; inverse-transform vertices by each link's robot-base transform at supplied CAD pose `(0°, −90°, +90°, 0°, 0°, 0°)` to joint-local space. Convert mm→m once; export separate link GLBs and validate home reassembly against original core. Revalidate grouping after source re-export/hash/parser/order changes. Exclude broad base plates/under-base anchors, ancillary cabling and over-arm dress attachment; not every STEP object is animated. Add scanner separately at verified flange.

Comparison evidence: 81 STEP meshes/730,266 triangles; seven reference links/46,059 triangles. 3,000 reference-to-STEP samples: median 0.133 mm, 95th percentile 2.111 mm. Reverse whole-file comparison differs substantially due to excluded accessories. Sampled correspondence is not exhaustive identity proof; supplied-core runtime meshes avoid reference simplification.

Runtime acceptance evidence: STEP/candidate bounds in common units; rigid alignment and neutral/display-pose explanation; base/shoulder/upper-arm/forearm/wrist/flange shape correspondence; six axis locations/directions from CAD and/or independent manufacturer dimensions; known-pose flange position/orientation; aligned overlap/nearest-surface residuals and limitations; independent FK versus measured axes/flange. Names/reach/colors are insufficient. Pivot/core mapping passed; repair preprocessing if exports fail reassembly, without replacing/scaling robots.

Excluded OPW file: 260 mm base offset, 675 mm shoulder height, 680 mm upper arm, 158 mm flange offset mismatch this geometry/chain; no convention conversion established. Use verified chain directly.

Verified-chain origins below are parent-local mm; joint-origin rotations identity; axes local unit vectors. Internal angles radians; use original KR 16 R1610 manufacturer ranges/speeds.

| Joint / child | Parent | Local origin (mm) | Local axis | Range (degrees) | Rated speed (degrees/s) |
| --- | --- | --- | --- | --- | --- |
| A1 / link 1 | base | (0, 0, 520) | (0, 0, −1) | −185 to +185 | 200 |
| A2 / link 2 | link 1 | (160, 0, 0) | (0, +1, 0) | −185 to +65 | 175 |
| A3 / link 3 | link 2 | (780, 0, 0) | (0, +1, 0) | −138 to +175 | 190 |
| A4 / link 4 | link 3 | (655, 0, 150) | (−1, 0, 0) | −350 to +350 | 430 |
| A5 / link 5 | link 4 | (0, 0, 0) | (0, +1, 0) | −130 to +130 | 430 |
| A6 / link 6 | link 5 | (153, 0, 0) | (−1, 0, 0) | −350 to +350 | 630 |

Base datum=base-link frame; flange=link 6; tool0=flange rotated +90° local Y. Xacro visual origins are identity; verify COLLADA units/up-axis before GLB conversion, without undocumented rotations. Static CAD establishes axis lines/dimensions, not motor signs or 16 kg versus 22 kg payload. Consistently use source signs/chosen KR 16 limits; no exterior-geometry payload/controller-sign claims.

One immutable RobotDefinition plus CAD-derived link GLBs serves rendering/FK/IK. Record mesh hashes/units/source revision/origins/axes/limits/flange-tool conventions/home. Wrist-center radial chain: `160 + 780 + sqrt(655² + 150²) ≈ 1611.96 mm`, matching 1612 mm catalogue reach. Flange 153 mm and emitter offset are separate; never use a floor-origin 1612 mm emitter sphere. Screen conservatively from actual chain/tool; verified FK/IK/intervals decide feasibility.

Retain community Apache-2.0 notices and importer/bundled-component LGPL-2.1 notices/source obligations. Proprietary screenshot inspires layout/laser only; do not reproduce its UI assets.

### 4. Coordinate convention and fixed placement

Right-handed robot-base datum at mounting plane: +Z up, +X toward door, +Y remaining horizontal direction. Internal meters/radians; display/export mm. Preserve source units, explicitly normalize to meters; no bounding-box normalization/aesthetic scaling.

Floor Z=0; robot rests on it. Upright door lowest point Z=0, outer face generally −X, horizontal center near Y=0. Decorative nonselectable 4×4 m floor: ~100 mm fine grid/~500 mm strong lines. Start with main skin ~900 mm forward as a candidate, not a solved distance. Verify actual dimensions/chain; test front targets, stand-off, wrist, floor alignment and visual clearance; freeze one numeric rigid transform in manifest before release. No runtime search/position controls.

Home `(0°, −90°, +90°, 0°, 0°, 0°)` matches supplied CAD and intervals; flange `(968,0,1450)` mm. Demo home is not official controller home. Check door clearance; if necessary freeze a validated replacement vector/flange pose before release, never operator-selected. Store part-local/base positions and normals; use fixed rigid transform, rotate/renormalize normals. Camera cannot change exports. Original STEP keeps CAD coordinates, without viewer placement.

### 5. Viewer and interface

Compact toolbar, viewport ~75–80% width, narrow point/status panel; downloads appear with terminal result. Toolbar: Import STEP, source name, stand-off mm, Run, Stop. Load prepared door by default after gate; import replaces model, clears selections/results, restores home/new session. Disable import in preparing/running; reload restarts.

Three-quarter perspective contains robot/door/scanner/floor. OrbitControls orbit/pan/zoom target interaction center; fit camera after load without scaling. Readable lighting, restrained gray door, recognizable supplied robot; small datum/hint “Click the door to add scan points.” No dense proprietary menus/device panels/branding/fixtures.

Markers are 1-based; list number, base XYZ mm to one decimal and plain-language status. Exports use six decimals without accuracy claims. Text+color distinguish pending/ready/current/visited/not visited/problem. Progress: “Point 3 of 7”, “2 of 7 visited”; completion: “Simulation complete”, not “Scan acquired.” Run requires loaded verified assets and ≥1 point. Stop enabled in preparing/running, terminates motion immediately; ordinary web control, not physical emergency stop.

### 6. STEP import and picking

Local occt-import-js worker; no CATPart. Explicit meter output; initial absolute linear deflection 0.001 m/angular 0.25 rad must be verified against door, not assumed accurate. Indexed Three BufferGeometry per mesh; retain returned face associations. Bundled STEP uses same importer or derived GLB cache with separate original bytes; units/placement/picking consistent.

Retain File/Blob or separate full bytes before worker transfer; sole transferred ArrayBuffer detaches. Transfer typed result arrays to avoid repeated large copies. Validate file presence/parsing; documented 50 MiB/file cap. Report unsupported format/no mesh/malformed file/memory-worker errors; indeterminate “Loading model…” unless real progress is available. Readable WebGL2-unavailable outcome.

Raycast only nearest visible door geometry; exclude robot/scanner/floor/laser/markers. Empty window is unselectable unless actual glass exists. Convert hit to source part/base frames using immutable transforms. Pointer release ≤5 CSS pixels from down, no multitouch, inside canvas creates exactly one point; ignore drags/outside/non-door hits. Barycentrically interpolate imported normals, fallback triangle normal; normalize, orient toward clicked side and permanently store sign. Export this approximate mesh-derived approach-side convention; no exact analytic-normal claim. IDs/order 1-based append order; no vertex snapping; route line not required.

### 7. Scanner and laser visualization

Rectangular scanner at tool0 (+90° flange-local Y): initial 80 mm wide×60 high×80 deep; rear-face mount; optical local +Z; center tool0 +Z 40 mm, emitter +Z 80 mm. Manifest flange-to-emitter=+90° Y rotation then 80 mm tool-axis translation. Home emitter `(1048,0,1450)` mm, optical axis base +X.

Stand-off default 100 mm, numeric 50–500 mm before Run; validate/lock during and after preparation. Demo value, not physical scanner spec. Surface p/unit approach normal n → emitter position `p + stand_off*n`, optical axis `−n`. Deterministic roll projects world-up perpendicular to optical axis with fixed alternate reference near parallel; record for repeatability. Flange target composes inverse demo flange-to-emitter mount; emitter target is not wrist position.

Render a rigid scanner-attached 3D red rectangular projection volume, as amended by the user on 2026-10-05 after #9/#10. An 80×60 mm aperture expands into a filled 240×180 mm rectangular end. Four translucent side walls (opacity 0.16), a 13×9 grid of 117 rays (opacity 0.40), and the filled end (opacity 0.38) show depth and a surface area rather than a line. Axial reach equals the selected stand-off in meters, including 500 mm; off-axis rays are correspondingly longer and keep the same rectangular end dimensions. These dimensions are illustrative, not a measured physical scanner specification. Activate on movement toward the first point after whole-route preflight and keep on continuously during approach, transitions and endpoint dwells. It is off in selecting/preparing and completed/blocked/stopped/failed states; Stop immediately extinguishes it. The fan follows the actual articulated emitter pose, with no independent aiming or repositioning. Exclude it from selection and exports; no acquired measurements, new door geometry, physical laser model, dense point cloud or reconstruction. Written visual requirements are actionable; no unavailable screenshot-match claim.

### 8. Robot kinematics and sequence execution

Rendering/FK share verified rigid-link hierarchy/local revolute axes/pivots; never translate entire robot to target or use generic skinned rig. Fixed-six-joint TypeScript DLS solves full position/orientation: geometric Jacobian, damping, bounded small angular steps, hard-interval projection, six-dimensional position/SO(3) error, explicit orientation scaling. Initial orientation length weight 0.25 m is tuning, not calibration.

Worker preflights entire immutable ordered run; ≤8 deterministic seeds (preceding verified pose, home first), ≤200 iterations/seed; prefer validated least displacement from preceding pose. Tune seeds/damping for actual fixed door; no general solver/every-pose guarantee. Independently recompute FK; require finite values, intervals, emitter ≤5 mm, optical axis ≤5°, full orientation ≤5° retaining chosen roll. Never accept final clamping without residual recomputation.

Conservative chain/tool bound failures=`outside_reach`; bounded-search failures=`pose_unsolved`/“Pose not solved” (not proof of physical unreachability). Record errors/reasons. Any failed target blocks all motion; highlight diagnostics/“Sequence blocked”, enable truthful downloads; never skip/fake completion. Recover by fresh import/reload.

Preflight every inter-point scan transition as well as its endpoints. Linearly interpolate the selected surface-position polyline and shortest-arc interpolate the full deterministic endpoint emitter orientations; the interpolated approach-side normal is minus emitter +Z. The emitter follows that surface position plus the actual selected stand-off along the normal. On a planar region this keeps the scanning face parallel to the surface; curved routes smoothly follow the selected normal/orientation field. Opposite (antipodal) normals are ambiguous and block with a readable diagnostic. This policy does not reconstruct intervening CAD surfaces or plan coverage.

Solve intermediate emitter targets using the preceding accepted joints and the inverse emitter mount. Adaptively subdivide and validate the exact smoothstep joint interpolants against emitter position, full orientation and optical-axis errors. Use intermediate checks plus conservative between-sample derivative bounds to guarantee ≤5 mm/≤5° over accepted scan segments, hard finite intervals and conservative speeds before any motion; bounded subdivision/search failure blocks the entire run. The home-to-first approach uses bounded joint interpolation and establishes scan stand-off on arrival, without claiming constant distance before reaching the first point.

Execute only the accepted waypoint path. Use 10%-rated demo joint speeds with smoothstep's 1.5 peak derivative: each scan subsegment duration is at least `1.5 * max_j(abs(Δq_j)/demo_speed_j)` (10 ms minimum); home approach retains a 1-second minimum. Keep the laser on continuously from the first approach through all scan transitions and 1-second endpoint dwells. Mark Visited only after each accepted dwell. No angle wrapping through forbidden intervals, torque/payload dynamics, acceleration limits, collision planning or controller blending claims.

End at last visited target. Stop session/run token cancels preparation/animation, laser off, joints frozen, statuses retained; reject late cancelled/replaced worker results.

### 9. Data contracts and state

Four cohesive responsibilities: asset/import, scene/picking, kinematics/execution, export; UI/session composes them. Explicit worker boundary; internal helpers are not public APIs.

| Contract | Required information |
| --- | --- |
| PartAsset | Source name/format, original bytes or Blob, source hash, source units, normalized indexed meshes/normals, fixed part-to-base transform, optional CAD face references |
| RobotDefinition | Geometry/source hashes, base and flange/tool frame conventions, rigid link visual transforms, six ordered joint parent/child relationships, origins, axes, hard bounds, demo speeds, validated home vector, flange-to-emitter transform |
| SelectedPoint | Stable ID/order, part-local surface position/normal, robot-base surface position/normal, mesh/triangle hit reference, current selection status |
| RunPlan | Immutable point snapshot, stand-off, target emitter/flange poses, solved six-angle vectors, verified scan waypoint paths/durations and between-sample error bounds, validation residuals and problem reasons |
| RunState | Session/run IDs, lifecycle state, current point, visited count, elapsed transition/dwell time, current joint vector, terminal reason |
| DownloadSnapshot | Source STEP identity plus the same ordered selected surface points/normals and terminal point statuses used by both writers |

Motion transforms/angles/positions Float64; render buffers may be Float32. Reject nonfinite values/inconsistent units before motion/export.

| State | Behavior and exit |
| --- | --- |
| loading | Prepare source/model assets; success enters selecting; failure displays import error |
| selecting | Append points and edit stand-off; Run starts preparing if points exist |
| preparing | Lock selection/import/settings; preflight all poses; success enters running; a pose failure enters blocked; Stop enters stopped |
| running | Animate solved joints and dwell in selection order; all visits enter completed; Stop enters stopped; an unexpected failure enters failed |
| completed | All selected points visited; show result/downloads; no editing or rerun |
| blocked | At least one preflight target failed; no robot movement; show diagnostics/downloads |
| stopped | Sequence cancelled; current pose frozen; show truthful statuses/downloads |
| failed | Unexpected run error; no fake completion; retain data and display available downloads |

Point codes: `selected`, `ready`, `moving`, `visited`, `outside_reach`, `pose_unsolved`, `not_visited`, `stopped`. Terminal Stop maps moving→stopped, unvisited ready→not_visited; preparing cancellation→not_visited except established diagnostics. Immutable snapshots prevent asynchronous export disagreement.

### 10. Downloads

Three separate explicit terminal-state browser buttons; no auto-downloads/multi-download permission dependency. Disable zero-point point exports. Blob/object URLs released when unused.

#### PLY selected-point cloud

ASCII PLY 1.0, one vertex/selected point in selection order, no faces. Double XYZ/normal XYZ, six decimal places. Header: base frame, mm, approach-side normal convention, source identity, selected CAD points rather than measurements. Exclude scene/markers/lines/robot/scanner/laser.

#### CSV coordinate file

UTF-8 rectangular comma CSV with header, exact columns:

`point_id, order, frame, units, x, y, z, normal_x, normal_y, normal_z, stand_off_mm, target_x, target_y, target_z, status, reason, position_error_mm, orientation_error_deg`

All selections/outcomes, IDs/order preserved. Surface XYZ exactly matches PLY base-mm serialization; target XYZ is separate stand-off emitter position, never replacement wrist coordinates. Unitless normals; unattempted/unsolved residuals empty, not zero; application-controlled plain-text reason quoted as needed. Coordinate/pose-planning data, not KUKA program.

#### Original STEP download

“Download original STEP”: exact genuine bundled/imported bytes, basename/extension when possible. No scan data/markers/transformed geometry/robot/reconstruction. Bundled means supplied replacement DOOR-of-CAR.step; absent asset means unavailable, never substitute old door/CATPart/unrelated STEP. Coordinate filenames: sanitized model basename + selected-points/selected-coordinates suffixes. Source text cannot become executable CSV. Deterministic metadata/serialization, locale-independent decimal point.

### 11. Performance, compatibility, and delivery

Current desktop Chrome is the final browser target, following the user's 2026-10-05 Chrome-only clarification recorded in README. Edge/Safari are excluded from this release gate. WebGL2/WASM/pointing device/sufficient asset memory required; mobile/broad version support excluded. Readable 1280×800 and 1440×900; ≥30 FPS representative run on presenter hardware; responsive UI/camera during parsing/preflight. Measure actual asset load/production transfer sizes, not npm unpacked size. Preprocess/decimate only within surface/pose tolerances.

Deliver reproducible dev/build/preview commands, prepared static assets, license notices, verification record/browser acceptance tests. Static HTTPS hosting; no provider specified. Local browser uploads; no persistence; refresh=fresh session.

### 12. Implementation sequence and completion gates

1. **Prepare and verify assets:** validate replacement STEP/dimensions; source-CAD link GLBs using verified pivots/grouping and home reassembly; immutable robot/door manifests/cache; freeze placement/home/mount and representative five-point route. Gate: actual shapes/units/pivots/flange/candidate poses verified.
2. **Static viewer:** selected stack/same-origin workers, actual robot/door/scanner/floor, camera/STEP loading. Gate: correct dimensions/placement in production preview.
3. **Selection:** door picking/numbering/coordinates/order/drag filtering. Gate: independent hits/transforms within ±5 mm.
4. **Motion:** manifest FK/full-pose bounded IK/preflight/interpolation/stand-off/laser/progress/Stop. Gate: five-point runtime route, bounds/residuals/truthful failures/Stop.
5. **Exports:** shared snapshots/byte-preserving STEP. Gate: independent parsers/counts/coordinates/metadata/matching STEP hashes.
6. **Demo acceptance:** actual-assets production browser workflow/layout/Chrome/presenter performance. Gate: all criteria, no unexplained substitutes.

No implementation is claimed. Stage 1 freezes asset-dependent placements/home; never defer to operator/runtime UI.

## Testing Decisions

At specification time no codebase/test suite/prior seam exists. Agreed baseline: full public browser workflow plus independent numerical geometry/coordinate checks; screenshots cannot establish geometry/export correctness. Test observable behavior/files, not private components or duplicated production math; avoid redundant component tests.

### Browser acceptance

- Load the prepared actual door; confirm robot, door, scanner, and floor are present and UI reaches selecting.
- Upload a known valid STEP; confirm a fresh session, fixed placement, unchanged size, cleared selections, home pose, and stored source identity.
- Select at least five known visible surface locations; verify marker numbering, list order, approximate known robot-base coordinates, and normalized approach-side normals.
- Orbit and drag the camera; confirm no extra point. Click robot, floor, scanner, laser, and window opening; confirm no extra point.
- Run the representative door route; observe link rotation, emitter stand-off, continuous laser scanning, progress, and final visited count.
- Test a known outside-bound target and a deliberately unsolved pose; neither starts a false completed sequence, and their diagnostic categories remain distinct.
- Stop once during preparation and once during movement; confirm cancellation/frozen pose, inactive laser, retained selections, and no late worker continuation.
- Capture all three downloads. Parse CSV/PLY with independent readers and compare point count, ID/order correspondence, surface coordinates, normals, frame, and units. Compare STEP input/output SHA-256.
- Confirm stopped/blocked exports retain every selected point and distinguish visited/not-visited/problem rows.
- Exercise malformed STEP, unsupported CATPart upload, zero-point Run, worker failure, and WebGL2 unavailability with understandable outcomes.
- Run the same workflow against the static production build, including worker/WASM URL resolution and asset downloads. Run current desktop Chrome acceptance.

### Independent geometry and math checks

- Compare actual source robot CAD axes/flange positions with the compiled manifest and independently calculated FK for known poses. A solver validating itself with the same incorrect chain is not sufficient evidence.
- Check analytic Jacobian columns against finite differences during development, including revolute-axis sign and unit handling.
- Check part-to-base position/normal transformations using an independently known rigid-transform fixture. Camera orientation must not alter exports.
- Validate solved pose residuals and hard angular intervals. Test near an interval boundary and a singular/unsolved pose; ensure there are no NaNs or angle wraps through a forbidden interval.
- Confirm scanner mounting composition: correct emitter target can require a different wrist/flange position.
- Verify representative intermediate joint-space samples stay inside limits and comply with conservative chosen peak joint speeds.
- Use a small synthetic STEP only as an automated accuracy/error fixture; it must not replace the actual demonstration door.

### Acceptance evidence

Retain robot verification measurements and screenshots, replacement door provenance/dimensions, source hashes, frozen placement/home/mount manifest, five-point route result, downloaded-file comparisons, browser matrix, and a short performance measurement. Final acceptance is blocked until the replacement door geometry validation and actual robot match pass.

## Out of Scope

- Physical robot/controller communication or KUKA program generation.
- Real scanner/LiDAR connections, acquired point clouds, scan reconstruction, and reconstructed STEP export.
- Direct CATPart parsing in the web app or an automated cloud conversion backend.
- Fixtures, clamps, a separate support table, cell walls, or a configurable workstation.
- User movement/rotation/scaling of the door or robot, dynamic placement optimization, arbitrary robot selection, and general-purpose cell design.
- Point deletion, reordering, undo, pause, reset, session saving, authentication, and collaboration.
- Runtime collision checking, self-collision checking, path planning, torque/dynamics simulation, calibration procedures, and production safety validation.
- Dense surface point-cloud generation, coverage planning, scanning sweeps, feature snapping, exact analytic CAD normals, or submillimeter metrology.
- Copying the proprietary reference application’s menus, branding, device controls, or assets.
- A guarantee that every point on either side of an arbitrary part is reachable with the requested orientation.

## Further Notes

### Domain vocabulary

- **Surface point:** a clicked location on the actual door surface. These are the primary PLY/CSV coordinates.
- **Approach-side normal:** the mesh-derived unit normal oriented toward the side selected by the operator.
- **Emitter/TCP:** the scanner’s optical origin attached to the wrist. It is positioned away from the surface by the stand-off.
- **Flange:** the verified mechanical mounting frame on the final robot link.
- **Home pose:** one validated, fixed six-angle starting configuration.
- **Robot-base frame:** the shared scene/export coordinate system defined by the robot mounting datum.
- **Visited:** the simulated robot reached the accepted target and completed its visual dwell. It does not mean a real scan was captured.
- **Original STEP:** the unchanged genuine STEP loaded by this web session, including the user-supplied replacement door STEP for the bundled demo.
- **Ready-for-agent:** the product decisions and staged work are specified. It does not bypass the mandatory asset verification gates.

### Research sources and qualification

- [Official KUKA KR 16 R1610 datasheet](https://www.kuka.com/-/media/kuka-downloads/imported/8350ff3ca11642998dbdc81dcc2ed44c/0000262125_cs.pdf): exact original model’s reach, axes, ranges, rated speeds, and dimensions. A datasheet alone does not articulate the supplied CAD solids.
- [KUKA Download Center](https://www.kuka.com/services/downloads): official CAD/specification access is directed to KUKA Xpert/my.KUKA. An authenticated articulated CAD download and its redistribution terms have not been verified.
- [ROS-Industrial original-model contribution](https://github.com/ros-industrial/kuka_experimental/pull/146): source of the verified joint chain and comparison link meshes; open/unmerged. Actual supplied-CAD geometric checks, not the model name, establish compatibility.
- [Pinned joint description](https://github.com/isys-vision/kuka_experimental/blob/07b45e70914e2eb653215de7f95d7e665de9b867/kuka_kr16_support/urdf/kr16r1610cybertech_macro.xacro) and [pinned license](https://github.com/isys-vision/kuka_experimental/blob/07b45e70914e2eb653215de7f95d7e665de9b867/LICENSE): reproducible joint-definition provenance. Runtime primary-body meshes will be derived from the user's supplied STEP.
- [occt-import-js](https://github.com/kovacsv/occt-import-js): local STEP/IGES/BREP tessellation; no CATPart support. The researched npm release is 0.0.23 even though repository main may advertise a later version.
- [Three.js raycasting](https://threejs.org/docs/pages/Raycaster.html): surface picking and hit data.
- [Damped least-squares inverse-kinematics survey](https://mathweb.ucsd.edu/~sbuss/ResearchWeb/ikmethods/iksurvey.pdf): primary numerical-method reference; the bounds, orientation weights, seeds, and acceptance criteria are application decisions.
- [Playwright downloads](https://playwright.dev/docs/downloads): browser-level file verification.

### Specification-time inputs and unresolved asset facts (historical)

At specification time, planning/research and local supplied CAD existed; no application had been built/tested yet. Tracker: GitHub K-a-y-C/KaKue, slices published in blocker order; vocabulary/decisions authoritative. Only replacement door and exact robot hashes qualify; provision/check exact inputs in each checkout, never substitute or assume GitHub raw CAD availability. Text planning documents are published. Home/pivots established; final numeric door placement awaits verified replacement dimensions/representative poses, frozen before runtime acceptance. No CATPart prerequisite.

### Completed actual-geometry verification

Direct STEP cylinders/flange planes (mm): shoulder `(160,0,520)`, elbow `(160,0,1300)`, wrist intersection `(815.000003067,0,1450)`, flange `(968.000003067,0,1450)`. Home FK matches with max center discrepancy ~0.000003067 mm, below declared CAD uncertainty ~0.081886 mm: numerical CAD consistency, not physical metrology. Tessellation/closest-triangle sampling established §3 grouping/residuals. Whole-file visuals differ; retain supplied core, omit fixture/dress accessories, exclude mismatching OPW. Chosen source limits/speeds imply neither payload identification nor controller sign validation. Research tools installed/downloaded only in isolated temporary storage; project research retains images/reports; the web app was unbuilt/untested at that research stage.

### Current delivery evidence (2026-10-05)

The implementation now exists with accepted supplied assets, frozen placement/home/mount, actual five-point runtime scans and independently checked downloads. Static Chrome/layout/hardware acceptance is recorded in [issue #10 verification](../../docs/verification/issue-10.md); the final user amendment and declared hardware scheduling conditions are in [rectangular laser verification](../../docs/verification/laser-volume.md). The earlier specification-time notes above remain historical context, not the current implementation status.
