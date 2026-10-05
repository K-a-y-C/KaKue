# Robot Door Scan Demo — Product Requirements Document

Status: ready-for-agent
Version: 1.2 — 2026-10-05
Owner: Kakue
Readiness: complete implementation specification. Supplied-robot pivot and core-link correspondence have been checked; the replacement door STEP is supplied, and door geometry validation and final runtime asset preparation remain acceptance gates.

## Problem Statement

A presenter needs a simple web application that demonstrates how an operator could plan a robot-based scan of an automotive door. The operator must see an actual 3D door and an articulated six-axis robot, click specific locations on the door, watch the robot visit those locations in order, and download the selected coordinates. The demo must use the supplied robot geometry and supplied door geometry rather than unrelated models chosen solely because their filenames sound similar.

The current workflow is a product demonstration. It does not connect to a robot or scanner, collect measurements, reconstruct a scanned surface, or create a production robot program. Position accuracy within ±5 mm relative to the imported CAD geometry is sufficient. Reliable interaction, plausible joint-constrained movement, truthful completion status, and valid downloadable files take priority over sophisticated engineering features.

The sole authoritative door is `3d files/car-front-door-1/DOOR-of-CAR.step`, supplied by the user on 2026-10-04. Ignore all previously supplied door files, including the earlier CATPart. This STEP has an AP214 header declaring millimeter units; no CATPart conversion is required. Full geometric validation remains an acceptance gate. The supplied robot STEP contains static geometry, so its link/joint structure must be established and checked independently.

## Solution

Build a desktop web app with a large, simple 3D viewport and a compact side panel. A fixed robot stands on a shared grid floor. The door stands upright on the same floor, facing the robot at one predefined, reachable location. There are no fixtures, tables, part-position controls, scale controls, or robot-selection controls.

A rectangular scanner is attached rigidly to the robot wrist. Its emitter produces a red laser fan that moves with the scanner. The effect is illustrative and produces no measurement data.

The demonstration follows one sequence:

1. Open the application and load the prepared demo door, or import its STEP file.
2. Orbit, pan, and zoom the camera to inspect the fixed scene.
3. Click the door surface to add numbered markers and coordinate rows.
4. Press Run. The application checks target poses using the actual robot chain and joint limits.
5. If every target has a verified solution, the robot moves from its predefined home pose through the points in selection order. The scanner follows a preflighted surface-facing path and displays a continuous dense laser fan from the first approach through every transition and endpoint dwell.
6. Display progress and a final simulated completion status. If preparation fails or Stop is pressed, display the corresponding outcome accurately.
7. Download selected points as PLY, selected coordinates and status as CSV, and an unchanged copy of the STEP that was loaded.

The operator does not delete or reorder points, move the door, select another robot, pause, or reset the run. Reloading the page or importing again starts a fresh demonstration.

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

1. As a presenter, I want the app to show a six-axis robot and an automotive door immediately after the demo asset loads, so that the purpose is clear.
2. As a presenter, I want the robot geometry to correspond to the actual supplied robot, so that the movement demonstration represents the intended machine.
3. As a presenter, I want the supplied door geometry to be used, so that the demonstration relates to my chosen part.
4. As a presenter, I want the prepared door available as a bundled demo asset, so that I can demonstrate without navigating to a local file every time.
5. As an operator, I want to import a STEP file, so that I can demonstrate loading the part rather than only displaying a hardcoded mesh.
6. As an operator, I want an honest loading message and readable import error, so that I know when a model is ready or cannot be opened.
7. As an operator, I want original CAD dimensions preserved, so that the robot and door have compatible physical size.
8. As a presenter, I want one predefined door position, so that the scene is consistent and no setup manipulation is required.
9. As a viewer, I want the robot and door on one grid floor, so that I can understand their relative locations.
10. As a viewer, I want a scanner box on the wrist, so that I can understand what the robot is carrying.
11. As a viewer, I want a continuous dense red laser fan along the ordered scan, so that I can understand the scanning concept.
12. As an operator, I want to rotate, pan, and zoom the view, so that I can inspect and select the door surface.
13. As an operator, I want to click any visible door surface, so that I can choose scan locations without entering coordinates manually.
14. As an operator, I want each click to create a numbered marker, so that the scan order is visually apparent.
15. As an operator, I want a matching point list with XYZ coordinates, so that I can confirm what will be exported.
16. As an operator, I want camera drags distinguished from selection clicks, so that changing the view does not add unwanted points.
17. As an operator, I want clicks on the floor, robot, scanner, laser, and empty window opening ignored, so that only actual part locations become targets.
18. As an operator, I want the visit order to equal selection order, so that the behavior is predictable.
19. As a presenter, I want one Run control, so that I can start the complete sequence easily.
20. As a presenter, I want the sequence to start at a predefined home pose, so that each fresh demonstration has the same starting point.
21. As a viewer, I want the robot links to rotate around their real joints, so that the motion resembles a CAD assembly and a physical robot.
22. As a viewer, I want the scanner to face each selected surface location at a stand-off distance, so that the scanning action is understandable.
23. As an operator, I want a simple stand-off setting before Run, so that I can demonstrate the scanner’s distance from the part.
24. As an operator, I want unreachable or unsolved target poses identified, so that the demo does not claim impossible movement.
25. As a presenter, I want a current-point indicator and completed-point count, so that the audience can follow progress.
26. As a presenter, I want Stop to terminate the sequence, so that I can end an unsuitable demonstration.
27. As an operator, I want point selection and settings locked during a run, so that the active sequence cannot change underneath the robot.
28. As an operator, I want completed, stopped, and blocked outcomes distinguished, so that the displayed result is truthful.
29. As an operator, I want to download a PLY containing only my selected points, so that another 3D tool can open those locations.
30. As an operator, I want to download a CSV with coordinates, normals, selection order, and simulation status, so that another system can interpret the selections.
31. As an operator, I want coordinate units and frame identified in both exports, so that their values are not ambiguous.
32. As an operator, I want stopped, failed, and unvisited selections retained in exports, so that no selected data silently disappears.
33. As a presenter, I want a STEP download of the same model that was loaded, so that I can demonstrate the third download without implying a scan was reconstructed.
34. As an operator, I want all files downloaded through ordinary browser controls, so that no special viewer account or export service is needed.
35. As an operator, I want a fresh session after reload or another import, so that I can start over without additional editing controls.
36. As a presenter, I want the interface to work on a laptop or desktop browser, so that I can present the demo using ordinary equipment.
37. As a developer, I want rendering and motion to use the same verified robot definition, so that a visually correct robot cannot be paired with unrelated kinematics.
38. As a developer, I want asset provenance and dependency versions recorded, so that the delivered demo can be reproduced and validated.

## Implementation Decisions

### 1. Final MVP boundaries

The application contains one fixed robot and one demo part. Generic STEP parsing is included, but automatic placement optimization and compatibility with arbitrary parts are not. Another STEP can be loaded at the same predefined transform; only the supplied replacement STEP door is an acceptance asset.

The door remains fixed after load. It is never scaled to fit. The robot also retains its dimensions. Camera manipulation changes the view only.

Selected points are append-only. Duplicate surface clicks may create distinct numbered points. There is no delete, reorder, undo, pause, reset, return-home-after-run, trajectory editing, or automatic route optimization.

Checks are limited to conservative reach screening, inverse-kinematics residuals, and hard joint intervals. There is no runtime collision detection or collision-free path planning. Scene placement and the representative acceptance route are checked visually during asset setup to produce a sensible demonstration. This does not establish physical-cell safety.

### 2. Selected technology stack

Use a client-side static application with React for controls and status, TypeScript for typed contracts, Vite for development/build, and direct Three.js for the viewport. A React-managed scene lifecycle creates and disposes the imperative Three scene. Robot animation updates scene transforms directly; React is not rerendered for every frame.

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

These versions were researched on 2026-10-04. They are an initial pinned baseline, not a claim that the combined app has already been installed or tested. Commit a lockfile and verify the full production build before accepting implementation. Use Node 24 LTS for development; Vite requires an appropriate Node release, with its researched range including Node ≥22.12.

Use ordinary CSS, React state, Web Workers, browser File/Blob APIs, and a small local six-joint kinematics module. No UI framework, React Three Fiber, runtime ROS/URDF/Xacro parser, physics engine, Next.js/server rendering, backend, account, database, cloud CAD conversion service, or controller connection is required.

Serve STEP parser JavaScript and WASM as versioned same-origin static assets with an explicit WASM URL and the correct MIME type. Do not load dependencies from a third-party CDN at runtime. An ordinary worker avoids SharedArrayBuffer and cross-origin-isolation requirements.

### 3. Asset preparation and mandatory verification gates

#### Door gate

The sole source asset is `3d files/car-front-door-1/DOOR-of-CAR.step`. Ignore every previously provided door file. The accompanying JPGs in that folder are visual references only; they do not replace geometry.

Input identity: 14,456,880 bytes; SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`. Initial text inspection found valid ISO-10303-21 opening/closing markers, an AP214 AUTOMOTIVE_DESIGN schema, and millimeter length units. This inspection does not establish full parse success, geometric bounds, topology, or picking accuracy.

Reopen the supplied STEP in an independent CAD reader, verify its recognizable door shape and actual selectable surfaces/window opening, and record its millimeter bounding box. Preserve its complete original bytes for unchanged download. Optionally generate a GLB startup cache from this same STEP, retaining provenance, settings and hashes. A preview mesh or the supplied JPGs alone do not satisfy import/download acceptance.

No CATPart conversion task remains. Direct browser CATPart import is still excluded. Missing or invalid STEP geometry must be explicit in development; never substitute an older door or an image-derived model. Record source provenance as user-supplied replacement STEP; do not invent a conversion history.

#### Robot gate

The supplied robot STEP is a flattened AP214 model: one product, 73 BREP solids, and no assembly occurrence hierarchy. It is usable as a geometric reference but does not encode six movable link groups or robot joint constraints.

The selected joint-chain source is the original KR 16 R1610 contribution in ROS-Industrial PR #146, pinned to commit `07b45e70914e2eb653215de7f95d7e665de9b867`. Direct extraction of cylindrical axes and the flange plane from the supplied STEP verifies that its linkage dimensions match this chain independently of the filename. A subsequent comparison against actual STEP tessellation also establishes correspondence of the main robot bodies. The contribution remains unmerged and is not an official KUKA release. The original robot is not interchangeable with the newer KR 16 R1610-2.

**Final visual-asset decision: derive all main robot link geometry from the supplied STEP itself.** Use the researched DAE assets as comparison references, not as replacement runtime geometry. They omit accessories and have some local shape differences. This keeps the demonstrated robot's primary bodies faithful to the supplied file.

The verified grouping below applies only to the supplied STEP with SHA-256 `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`, imported by occt-import-js 0.0.23 in millimeters with 1 mm absolute deflection and 0.25-radian angular deflection. Indices are importer mesh-array indices, not STEP entity IDs. Each selected core mesh was sampled at 100 deterministic area-weighted surface locations and compared against every reference link using exact closest-triangle distances.

| Supplied STEP mesh indices | Runtime rigid link | Largest sampled correspondence error |
| --- | --- | --- |
| 73 | Fixed base | 1.703 mm |
| 8 | Link 1 | 0.742 mm |
| 6, 7 | Link 2 | 1.424 mm |
| 0, 1, 2 | Link 3 | 0.732 mm |
| 5 | Link 4 | 0.663 mm |
| 4 | Link 5 | 0.668 mm |
| 3 | Link 6 / flange | 0.768 mm |

To prepare runtime meshes, tessellate with that verified configuration, extract these groups, and apply the inverse of each link's robot-base transform at the supplied CAD pose (0°, −90°, +90°, 0°, 0°, 0°). This makes their vertices local to their actual joints. Convert millimeters to meters once, then export one GLB per rigid link. Reassemble at that pose and check the overlay against the original core geometry before release. The grouping must be revalidated after any source-file re-export, hash change, parser-version change, or changed mesh ordering.

Exclude the remaining CAD accessories from the demo: broad base plates/under-base anchors, ancillary cabling, and the over-arm dress attachment. This is deliberate simplification of the supplied geometry in keeping with the no-fixtures scope; it is not a claim that every object in the original STEP is animated. The required scanner box is added separately at the verified flange.

The underlying comparison used 81 actual STEP meshes totaling 730,266 triangles and seven reference link meshes totaling 46,059 triangles. A 3,000-sample reference-to-STEP comparison had median distance 0.133 mm and 95th percentile 2.111 mm. The reverse whole-file comparison is substantially different because the supplied CAD includes the excluded accessories. These are sampled correspondence measurements, not exhaustive surface-identity proof. Using the supplied core CAD directly removes dependence on the reference meshes' simplifications.

Before accepting the preprocessed runtime visual assets, preserve the completed source comparison and validate the exported groups. Evidence must include:

- Parsed STEP and candidate mesh bounding boxes in common physical units.
- A documented rigid alignment and explanation of the supplied neutral/display pose.
- Correspondence of the base, shoulder, upper arm, forearm, wrist, and flange shapes.
- Locations and directions of the six joint axes, inferred from CAD surfaces and/or independently confirmed manufacturer dimensions.
- Flange position and orientation in at least one known pose.
- Representative shape overlap or nearest-surface error after alignment, with residuals and limitations recorded.
- Forward-kinematics checks against those measured axis/flange locations.

Matching names, nominal reach, or colors is insufficient. The source pivot/core correspondence check has passed, and the mapping above makes preparation concrete. If exported runtime assets do not reassemble onto those measured bodies, repair preprocessing rather than substituting another robot or scaling one model to hide a difference.

A separate OPW parameter file was found alongside this description. Its 260 mm base offset, 675 mm shoulder height, 680 mm upper-arm length, and 158 mm flange offset do not directly match the measured supplied geometry or selected chain. No convention conversion was established. It is excluded from the implementation baseline. The numerical solver uses the geometrically verified joint chain directly.

Use the following verified-chain definitions and original KR 16 R1610 manufacturer's motion ranges. Origins are expressed in the parent link's frame, in millimeters; joint-origin rotations are identity. Axes are unit vectors in that local frame. Store angles in radians internally.

| Joint / child | Parent | Local origin (mm) | Local axis | Range (degrees) | Rated speed (degrees/s) |
| --- | --- | --- | --- | --- | --- |
| A1 / link 1 | base | (0, 0, 520) | (0, 0, −1) | −185 to +185 | 200 |
| A2 / link 2 | link 1 | (160, 0, 0) | (0, +1, 0) | −185 to +65 | 175 |
| A3 / link 3 | link 2 | (780, 0, 0) | (0, +1, 0) | −138 to +175 | 190 |
| A4 / link 4 | link 3 | (655, 0, 150) | (−1, 0, 0) | −350 to +350 | 430 |
| A5 / link 5 | link 4 | (0, 0, 0) | (0, +1, 0) | −130 to +130 | 430 |
| A6 / link 6 | link 5 | (153, 0, 0) | (−1, 0, 0) | −350 to +350 | 630 |

The base datum coincides with the base-link frame; the source flange frame coincides with link 6. The source tool0 frame is the flange frame rotated +90° about local Y. Mesh visual origins in the xacro are identity; verify the COLLADA asset unit/up-axis before converting to GLB rather than applying an extra undocumented rotation.

Static CAD establishes axis lines and linkage dimensions, not signed motor directions or the 16 kg versus 22 kg payload rating. Use source joint signs and the chosen KR 16 limits consistently for the visual MVP. Do not claim that the exterior geometry uniquely identifies a payload variant or validates real-controller conventions.

The final robot preparation produces one immutable RobotDefinition and separate CAD-derived link GLBs. Rendering and forward/inverse kinematics consume this same definition. Record link mesh hashes, units, source revision, joint-origin transforms, axes, limits, flange/tool conventions, and the accepted home pose.

The actual dimensions also resolve the reach convention: the radial chain to the A5 wrist center is 160 + 780 + square root of (655 squared + 150 squared), or approximately 1611.96 mm, consistent with the 1612 mm catalogue value. The 153 mm flange extension and scanner emitter offset are separate. Do not impose a 1612 mm sphere on emitter coordinates measured from the floor/base origin. Reach screening must use a conservative bound derived from the actual chain and tool; final feasibility comes from verified FK/IK and joint intervals.

Preserve applicable Apache-2.0 notices for the community robot assets. Preserve LGPL-2.1 notices/source obligations for the OCCT importer and its bundled components. The supplied proprietary reference screenshot is inspiration for spatial layout and laser presentation, not an asset to reproduce in the UI.

### 4. Coordinate convention and fixed placement

Use a right-handed robot-base frame throughout the scene and motion logic:

- Origin: the verified robot-base datum at the mounting plane.
- +Z: up from the floor.
- +X: the direction from robot base toward the demo door.
- +Y: the remaining right-handed horizontal direction.
- Internal distances: meters. Display/export distances: millimeters.

Preserve source units during import and normalize them explicitly to meters. A unit conversion is allowed; bounding-box normalization or aesthetic scaling is not.

The floor is the plane Z=0. The robot base rests on it. Place the door upright with its lowest point at Z=0, its outer face pointing generally toward −X, and its horizontal center near Y=0. Use a 4 m by 4 m floor, with a fine grid approximately every 100 mm and stronger lines every 500 mm. The floor is decorative and nonselectable.

Start asset setup with the door’s main skin plane approximately 900 mm in front of the robot-base origin. This is a placement candidate, not an asserted solved distance. After the actual door dimensions and robot chain are verified, choose a single final rigid door transform by testing representative front-surface targets, scanner stand-off, wrist configuration, floor alignment, and visual clearance. Record that numeric transform in the demo asset manifest before release. No runtime placement search or user position controls are introduced.

Use a fixed initial demo home vector of (0°, −90°, +90°, 0°, 0°, 0°), which reproduces the supplied robot CAD pose and is within all selected limits. Its flange center is (968, 0, 1450) mm in the robot-base frame. This is a demo starting pose, not a claim about KUKA's official controller home setting. Check visual clearance against the supplied STEP door during setup. If that actual asset requires a different starting pose, freeze the replacement vector and validated flange pose in the manifest before release; the operator never chooses it at runtime.

Store both part-local and robot-base positions for selected points. Calculate robot-base position with the fixed part-to-base rigid transform. Transform normals with its rotation and renormalize. Exports use robot-base coordinates; moving the camera never changes them. The unchanged STEP remains in its original CAD coordinates and does not bake in the viewer placement.

### 5. Viewer and interface

The page has one compact toolbar, a large viewport occupying about 75–80% of available width, and a narrow side panel containing the point list and run status. The download area appears with the terminal run result. Avoid the proprietary screenshot’s dense menus, device panels, branding, and fixtures.

The toolbar contains Import STEP, the source model name, stand-off in millimeters, Run, and Stop. The prepared demo door loads by default once the asset gate is complete. Import STEP replaces it, clears the previous selections/results, and returns the robot to the prepared home pose as part of a new session. Import is disabled while preparing/running. Reload is the simplest way to start again.

Show a three-quarter perspective view that contains the whole robot, door, scanner, and floor. Use OrbitControls for orbit/pan/zoom with a target near the center of the robot/door interaction. Fit the camera after load, without changing geometry scale. Retain readable lighting, restrained gray materials for the door, and the supplied robot’s recognizable appearance. A small datum indicator and an on-screen hint, “Click the door to add scan points,” are sufficient.

Each marker displays its 1-based number. The side panel lists that number, X/Y/Z in millimeters, and a plain-language status. Display coordinates to one decimal place; export six decimal places without suggesting that serialization precision improves physical accuracy.

Point states use both text and color: pending/ready, current, visited, not visited, and problem. Do not rely only on color. Progress reads “Point 3 of 7” and “2 of 7 visited.” Completion reads “Simulation complete,” not “Scan acquired.”

Run requires at least one point and loaded/verified assets. Stop is enabled during preparation/running and immediately terminates that session’s motion. It is a normal web control, not a physical emergency-stop interface.

### 6. STEP import and picking

`occt-import-js` parses STEP locally inside a Web Worker. Its documented formats do not include CATPart. Explicitly request meter output and use absolute linear deflection starting at 0.001 m and angular deflection starting at 0.25 radians. Verify those tessellation settings against the door; a nominal setting alone is not an accuracy guarantee.

Build indexed Three BufferGeometry per imported mesh. Preserve source face associations if returned. Either load the prepared STEP through the same importer or use a GLB generated from it as a startup cache, with the original STEP stored separately for download. Both paths must produce consistent units, placement, and picking coordinates.

Keep the original File/Blob or a separate complete byte copy. Transferring the only ArrayBuffer into a worker detaches it and would break unchanged STEP export. Worker results use transferable typed arrays to avoid repeatedly copying large mesh arrays.

Validate file presence and STEP parsing result. Limit individual STEP files to a documented demo cap of 50 MiB. Give actual parsing errors, including unsupported format, no mesh, malformed file, or memory/worker failure. Show an indeterminate “Loading model…” indicator unless the importer actually provides progress. Handle WebGL2 unavailability with a readable message.

Raycast only door meshes. Markers, robot, scanner, floor, and lasers are excluded. The window opening has no selectable surface unless glass is actually present in the supplied geometry. Convert the hit point back into source part coordinates and forward into robot-base coordinates using the immutable transforms.

Distinguish click from camera drag: require pointer release within 5 CSS pixels of pointer down and no multitouch gesture. A stationary click on the nearest visible door surface creates exactly one point. Ignore pointer releases outside the canvas and all hits that are not door geometry.

Compute a surface normal from barycentric interpolation of imported normals, falling back to the hit triangle normal. Normalize it and orient its sign toward the side from which the surface was clicked; this is the selected approach-side normal. Store that sign permanently. Explain this convention in export metadata. It is an approximate mesh-derived surface normal, not a claim of an exact analytic CAD normal.

Selected-point IDs and order are 1-based append order. The numeric surface position never snaps to a nearby mesh vertex. Numbered markers and the list convey order; a separate drawn route/path is not required.

### 7. Scanner and laser visualization

Attach a simple rectangular scanner box rigidly at the source tool0 frame, which is the verified flange frame rotated +90° around local Y. Initial decorative dimensions are 80 mm wide, 60 mm high, and 80 mm deep. Let the mount be the rear face of the box, its local optical axis be +Z, its center be 40 mm along tool0 +Z, and its emitter be 80 mm along tool0 +Z. Thus flange-to-emitter uses the source +90° Y rotation followed by the 80 mm tool-axis translation. Store this exact composition in the manifest. In the default CAD/home pose, the emitter is (1048, 0, 1450) mm with its optical axis along robot-base +X.

Use 100 mm stand-off by default. Allow one numeric setting from 50 to 500 mm before Run; validate and lock it during/after preparation for that run. This remains a demonstration setting and is not derived from a real scanner specification.

For surface position p and unit approach-side normal n, the scanner-emitter target position is p plus stand-off times n. The optical axis faces the part along −n. Choose roll deterministically by projecting world-up into the plane perpendicular to the optical axis, with a fixed alternate reference when nearly parallel. Record this choice so repeat imports/runs produce the same orientation.

The target is an emitter pose, not a wrist position. Convert it to the required flange pose by composing the inverse of the calibrated-in-the-demo flange-to-emitter transform. Omitting this transform would put the wrong point on the robot at the target.

Render a rigid scanner-attached red fan with a filled 240 mm wide sheet (opacity 0.28) and 61 dense red rays (opacity 0.65). Axial reach equals the selected stand-off in meters, including 500 mm; off-axis rays are correspondingly longer and retain the same 240 mm patch width. Activate on movement toward the first point after whole-route preflight and keep on continuously during approach, transitions and endpoint dwells. It is off in selecting/preparing and completed/blocked/stopped/failed states; Stop immediately extinguishes it. The fan follows the actual articulated emitter pose, with no independent aiming or repositioning. Exclude it from selection and exports; no acquired measurements, new door geometry, physical laser model, dense point cloud or reconstruction. Written visual requirements are actionable; no unavailable screenshot-match claim.

### 8. Robot kinematics and sequence execution

Use the same verified rigid-link hierarchy for rendering and forward kinematics. Revolute joints rotate about their actual local axes at actual pivot transforms. The robot does not translate its entire model to reach a point and does not use a generic skinned character rig.

Implement a fixed-six-joint damped least-squares numerical inverse-kinematics solver in TypeScript. Solve full position and orientation from the verified chain with a geometric Jacobian, damping, bounded small angular steps, and hard joint-interval projection. Use a six-dimensional position/SO(3) orientation error, with explicit scaling of the orientation term. A starting orientation length weight of 0.25 m is an implementation tuning value, not a physical calibration.

Use a deterministic bounded set of up to eight seeds, beginning with the previous verified pose and home, and up to 200 iterations per seed. Preflight the full ordered run in a worker. Prefer a verified solution with the least joint displacement from the preceding pose. Tune seed values and damping against the actual fixed door rather than adding a general-purpose robotics solver or guaranteeing every pose is solvable.

Accept a result only after independently recomputing forward kinematics and verifying finite values, joint intervals, emitter position error ≤5 mm, and optical-axis error ≤5°. Preserve the chosen roll convention; cap full orientation residual at the same 5° demo threshold. Never clamp a final answer and report it as reached without recomputing residuals.

Distinguish a target outside a conservative chain/tool reach bound from a bounded numerical search that failed. Label the latter “Pose not solved,” because numerical failure alone does not prove physical unreachability. Record errors and reason codes in run results.

If any target fails preflight, do not begin the motion sequence. Highlight failed points, show “Sequence blocked,” and allow downloads with accurate statuses. No failed point is silently skipped and no partial sequence is presented as completed. A fresh import/reload is the supported recovery workflow.

Preflight every inter-point scan transition as well as its endpoints. Linearly interpolate the selected surface-position polyline and shortest-arc interpolate the full deterministic endpoint emitter orientations; the interpolated approach-side normal is minus emitter +Z. The emitter follows that surface position plus the actual selected stand-off along the normal. On a planar region this keeps the scanning face parallel to the surface; curved routes smoothly follow the selected normal/orientation field. Opposite (antipodal) normals are ambiguous and block with a readable diagnostic. This policy does not reconstruct intervening CAD surfaces or plan coverage.

Solve intermediate emitter targets using the preceding accepted joints and the inverse emitter mount. Adaptively subdivide and validate the exact smoothstep joint interpolants against emitter position, full orientation and optical-axis errors. Use intermediate checks plus conservative between-sample derivative bounds to guarantee ≤5 mm/≤5° over accepted scan segments, hard finite intervals and conservative speeds before any motion; bounded subdivision/search failure blocks the entire run. The home-to-first approach uses bounded joint interpolation and establishes scan stand-off on arrival, without claiming constant distance before reaching the first point.

Execute only the accepted waypoint path. Use 10%-rated demo joint speeds with smoothstep's 1.5 peak derivative: each scan subsegment duration is at least `1.5 * max_j(abs(Δq_j)/demo_speed_j)` (10 ms minimum); home approach retains a 1-second minimum. Keep the laser on continuously from the first approach through all scan transitions and 1-second endpoint dwells. Mark Visited only after each accepted dwell. No angle wrapping through forbidden intervals, torque/payload dynamics, acceleration limits, collision planning or controller blending claims.

The final robot pose remains at the last visited target. Stop cancels preparation or animation using a session/run token, stops the laser, freezes the current joints, and retains visited and not-visited states. Late worker responses from cancelled or replaced sessions cannot change the scene or status.

### 9. Data contracts and state

There are four cohesive application responsibilities: part/asset preparation and import, scene/picking, kinematics/run execution, and export. UI/session orchestration composes them. The worker boundary is explicit; internal helpers are not public product APIs.

| Contract | Required information |
| --- | --- |
| PartAsset | Source name/format, original bytes or Blob, source hash, source units, normalized indexed meshes/normals, fixed part-to-base transform, optional CAD face references |
| RobotDefinition | Geometry/source hashes, base and flange/tool frame conventions, rigid link visual transforms, six ordered joint parent/child relationships, origins, axes, hard bounds, demo speeds, validated home vector, flange-to-emitter transform |
| SelectedPoint | Stable ID/order, part-local surface position/normal, robot-base surface position/normal, mesh/triangle hit reference, current selection status |
| RunPlan | Immutable point snapshot, stand-off, target emitter/flange poses, solved six-angle vectors, verified scan waypoint paths/durations and between-sample error bounds, validation residuals and problem reasons |
| RunState | Session/run IDs, lifecycle state, current point, visited count, elapsed transition/dwell time, current joint vector, terminal reason |
| DownloadSnapshot | Source STEP identity plus the same ordered selected surface points/normals and terminal point statuses used by both writers |

All motion-relevant transforms, angles, and positions are Float64 values. Render buffers may use Float32. Reject nonfinite values and inconsistent units before motion/export.

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

Point status codes are `selected`, `ready`, `moving`, `visited`, `outside_reach`, `pose_unsolved`, `not_visited`, and `stopped`. Terminal download maps a moving point at Stop to stopped and unvisited ready points to not_visited. Preparing cancellation preserves selections as not_visited unless a definite diagnostic was already established. Use immutable snapshots so exports cannot disagree after asynchronous updates.

### 10. Downloads

Provide three ordinary, separate download buttons in terminal states. These are explicit user actions; do not trigger three automatic downloads or depend on browser multi-download permission. Disable point exports when there are zero selected points. Use Blob/object URLs and release URLs when no longer needed.

#### PLY selected-point cloud

Use ASCII PLY 1.0 with one vertex for every selected point and no faces. Vertex order is selection order. Properties are X/Y/Z and normal X/Y/Z, written as double values with six decimal places. Header comments identify robot-base frame, millimeter units, approach-side normal convention, source model identity, and the fact that these are selected CAD surface points rather than scanner measurements. Export only selected points, never the entire scene, marker spheres, connecting lines, robot, scanner, or laser fan.

#### CSV coordinate file

Use UTF-8 rectangular CSV with a header row and consistent comma delimiters. Columns are: point_id, order, frame, units, x, y, z, normal_x, normal_y, normal_z, stand_off_mm, target_x, target_y, target_z, status, reason, position_error_mm, orientation_error_deg. The surface XYZ columns are the exact same robot-base millimeter positions serialized into the PLY. The target XYZ columns describe the separate scanner-emitter stand-off position. Normals are unitless. Empty residuals represent unattempted/unsolved values; they are not reported as zero. Reason is an application-controlled plain-text diagnostic, quoted as needed.

Include all selected points regardless of run result. Preserve IDs and order. Additional scanner-target columns do not change the core agreed export from surface coordinates to wrist coordinates. This CSV is coordinate/pose-planning data, not a KUKA controller program.

#### Original STEP download

Button label: “Download original STEP.” Return the exact bytes of the genuine STEP imported by the operator or loaded as the bundled demo asset. Preserve its basename/extension when possible. The download does not contain new scan data, point markers, transformed geometry, robot assembly, or a reconstructed door.

For the bundled demo, “original STEP” means the exact user-supplied replacement `DOOR-of-CAR.step` bytes loaded by the web app. If that asset is absent, the download is unavailable; an older door, CATPart, or unrelated STEP must not be used to fake acceptance.

Coordinate file names derive from a sanitized model basename with selected-points and selected-coordinates suffixes. Source-file text must not become executable CSV content. Metadata and numeric serialization must be deterministic; use a locale-independent decimal point.

### 11. Performance, compatibility, and delivery

Target current desktop Chrome/Edge first and smoke-test current Safari on macOS. The demo requires WebGL2, WebAssembly, a pointing device, and sufficient memory for the chosen asset. Mobile touch layouts and broad browser/version support are excluded.

Target a readable layout at 1280×800 and 1440×900, at least 30 frames per second during the representative run on the presenter’s machine, and responsive camera/UI during STEP parsing and pose preparation. Measure actual asset load and production bundle transfer sizes; do not equate an npm package’s unpacked size with network size. Preprocess/decimate visual assets without exceeding the selected surface/pose acceptance tolerance.

Deliver a reproducible development command, a production build, a preview command, prepared static assets, license notices, the verification record, and browser acceptance tests. Hosting is a static HTTPS deployment; a provider is not required to define this PRD. File upload remains local to the browser. There is no persistence requirement; refresh starts a fresh session.

### 12. Implementation sequence and completion gates

1. **Prepare and verify assets.** Verify the supplied replacement door STEP and its dimensions; no CATPart conversion is required. Use the completed robot pivot/core correspondence and verified mapping to generate source-CAD link GLBs; check their home-pose reassembly. Generate immutable robot/door manifests and GLB cache assets. Finalize fixed door transform, home pose, scanner mount, and a representative five-point route. Gate: actual shapes, units, pivots, flange, and candidate poses verified.
2. **Build the static viewer.** Initialize the selected stack and same-origin worker assets. Render robot, door, scanner, and shared floor. Add camera controls and STEP load path. Gate: actual assets visible at correct dimensions/placement in the production preview.
3. **Add point selection.** Implement door-only surface picking, numbered markers, coordinates, ordered point state, and camera-drag filtering. Gate: independent known hits and frame conversion within ±5 mm.
4. **Add motion.** Implement manifest-based FK, bounded full-pose IK, preflight, joint interpolation, scanner stand-off, continuous laser scanning, progress, and Stop. Gate: five-point route completes with validated joint bounds and pose residuals; failures and Stop remain truthful.
5. **Add exports.** Implement identical selected-point snapshots for PLY/CSV and byte-preserving STEP download. Gate: independent parsers confirm counts/coordinates/metadata; input and downloaded STEP hashes match.
6. **Accept the demonstration.** Run browser acceptance against the actual assets and production build, inspect layout at target sizes, perform Safari smoke test, and measure performance on the presenter’s machine. Gate: all acceptance criteria pass with no unexplained geometry substitutions.

No application implementation is claimed by this document. Asset-dependent numeric placements/home values are produced and frozen by stage 1, not deferred to the operator or runtime UI.

## Testing Decisions

There is no existing codebase or test suite in the workspace, so there is no prior test seam to reuse. The primary acceptance seam is the full browser workflow. Numerical kinematics/coordinate checks supplement it because a screenshot alone cannot establish correct robot geometry or exported coordinates. This verification approach was presented to the user during PRD preparation; absent additional requirements, it is the baseline.

Test observable behavior and file contents rather than component implementation details. Avoid redundant per-component tests or assertions that simply mirror the same math used by the implementation.

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
- Run the same workflow against the static production build, including worker/WASM URL resolution and asset downloads. Smoke-test Safari.

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

### Current inputs and unresolved asset facts

The local workspace contains planning/research documents and user-supplied source CAD, with no application implementation yet. The issue tracker is now GitHub `K-a-y-C/KaKue`; implementation slices are published in blocker order. The PRD's domain vocabulary and explicit design decisions are authoritative.

The user replaced all earlier door inputs with `3d files/car-front-door-1/DOOR-of-CAR.step`. Only this door is accepted. The robot input is `3d files/Robot/KR22_R1610-KR16_R1610.stp`, matching the verified source hash. Source CAD is available in the user's local workspace; an agent working in another checkout must ensure the exact inputs are provisioned before asset-dependent work and must never silently substitute geometry. Text planning documents are published to GitHub; raw CAD availability there must be checked rather than assumed.

The initial home pose and robot pivot geometry are established; exact numeric door placement requires the replacement STEP's verified dimensions and representative pose checks. Freeze that placement before accepting the five-point runtime demonstration. No legacy CATPart conversion prerequisite remains.

### Completed actual-geometry verification

Direct STEP cylinder and flange-plane measurements locate the shoulder at (160,0,520), elbow at (160,0,1300), wrist intersection at (815.000003067,0,1450), and flange at (968.000003067,0,1450) mm. The source chain reproduces these at the adopted demo home pose, with maximum center discrepancy approximately 0.000003067 mm, below the declared CAD uncertainty of approximately 0.081886 mm. This is a numerical CAD consistency result, not physical metrology.

Actual tessellation and exact nearest-triangle sampling subsequently established the core-link grouping and residuals recorded above. The supplied and reference whole-file visuals are not identical, so the final decision is to retain the supplied CAD's main bodies and omit the extra fixture/dress components. The researched chain is used directly; the mismatching OPW file is excluded. Source limits/speeds are used for this chosen demo variant without claiming that exterior CAD can distinguish payload variants or validate real-controller signs.

The research installed/downloaded geometry tools only into isolated temporary storage. Verification images and measurement reports have been retained with the project's research documents. The web application itself has not been built or tested yet.
