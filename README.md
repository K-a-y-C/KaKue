# KaKue — Robot Door Scan Demo

KaKue is a desktop web demonstration of selecting scan locations on an automotive door and watching a six-axis robot visit them. It uses the supplied door CAD and robot geometry, with a wrist-mounted scanner and an illustrative red laser fan.

**Current status:** the supplied assets are accepted, and issue #3 delivers the fixed browser scene with actual door, articulated CAD robot, scanner, floor and camera inspection. Issue #4 adds local STEP import, exact source retention, fresh model sessions and readable import failures. Issue #5 adds ordered surface selection, numbered markers, coordinate inspection and gesture/occlusion filtering. Issue #6 adds one verified scanner visit: stand-off settings, bounded local-worker pose preflight, articulated joint motion and one-second laser dwell, or an honest blocked result. Issue #7 adds complete ordered-route preflight and playback, current-point/visited progress, truthful blocked rows and actual five-point runtime acceptance. Issue #8 adds immediate Stop during preparation/transit/dwell, frozen pose, retained honest statuses and terminal failures with fresh-import recovery. Issue #21 adds continuous surface-facing waypoint scans, a dense 240 mm fan and stand-off through 500 mm, preserving #8 Stop semantics. Issue #9 adds separate terminal PLY/CSV and byte-preserving original STEP downloads. Issue #10 verifies the static release, production workflow/layouts and local hardware presentation performance. Read the [concise PRD](.scratch/robot-door-scan-demo/PRD.concise.md) first. The synchronized [full PRD](.scratch/robot-door-scan-demo/PRD.md) remains authoritative; consult it only for explanation or ambiguity. Ready-for-agent does not bypass the asset or production acceptance gates.

## Intended workflow

1. Open the branded welcome screen, then import a genuine STEP file locally to create the workspace.
2. Orbit, pan, and zoom; click the door surface to append numbered points and coordinates.
3. Choose a scanner stand-off from 50–500 mm and press Run.
4. Preflight every target against the verified robot chain and joint limits. When all targets pass, scan the ordered route continuously with surface-facing motion, progress and endpoint dwells.
5. Complete or Stop the simulation, then download selected surface points as PLY, coordinates and statuses as CSV, and the exact STEP bytes loaded by the session.

The robot and door have one fixed placement and retain their physical dimensions. Points cannot be deleted or reordered. Reloading or importing again begins a fresh session. Exports use robot-base coordinates in millimeters; camera movement never changes them.

This is a visual planning demonstration. It does not acquire scans, reconstruct surfaces, generate controller programs, connect to hardware, or perform collision checking. “Visited” means the simulated target and dwell completed.

## Asset gates

The sole authoritative door is `3d files/car-front-door-1/DOOR-of-CAR.step`. Earlier door assets are superseded; no CATPart conversion is needed. The supplied file is 14,456,880 bytes with SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`. Issue #1 independently reopened its actual surfaces in native OpenCascade, measured dimensions, checked the empty window and skin/frame probes, and prepared a meter-space GLB cache. Issue #5 verifies actual browser picking; issue #3 independently freezes scene placement. Preserve its exact bytes for the original STEP download.

Raw CAD and retained joint/research inputs are tracked after the manually merged source-intake PR. The [source manifest](assets/sources/manifest.json) records byte counts and SHA-256 identities; all retained entries were checked on 2026-10-04. The [source notes](assets/sources/README.md) explain provenance, reference-only material, and the retained license. An implementation agent must still recheck the exact geometry hashes in its checkout before asset preparation.

The supplied robot's seven core link GLBs are prepared directly from its exact STEP and reassemble at home within 0.000031 mm of the source tessellation. One [immutable robot manifest](assets/robot/robot-definition.json) supplies the signed joint chain, limits, speeds, home and scanner mount to rendering and Float64 FK. The [robot verification record](docs/verification/issue-02.md) includes independent STEP/xacro/manufacturer checks and home/articulation screenshots. Reference robot meshes remain comparison evidence. Manufacturer corroboration is a qualified cached official numerical record; original PDF bytes were unavailable.

### Robot preparation

With Node 24 LTS and installed Chrome, the robot asset preparation slice is reproducible:

```sh
npm ci --prefix tools/robot-assets
npm run prepare --prefix tools/robot-assets
npm test --prefix tools/robot-assets
npm run typecheck --prefix tools/robot-assets
npm run test:preview --prefix tools/robot-assets
npm run preview --prefix tools/robot-assets
```

Open the verification preview at `http://127.0.0.1:4172`. It shows actual core CAD, a home source overlay and an articulated wrist/scanner pose. The React/Vite application below uses these accepted links and the independently verified fixed door placement.

Issue #3 freezes and independently verifies actual door placement, replacement demo home, flange-to-emitter mount and a representative five-point setup route. Issue #7 verifies the fresh runtime solver and actual surface-click five-point route, including independent endpoint, intermediate joint/speed and sampled actual-mesh clearance checks. Final demonstration acceptance remains a later gate. Missing assets must remain explicit; substitutes cannot satisfy acceptance.

### Door preparation

Door preparation (Node 24 LTS, from the repository root):

```sh
npm ci --prefix tools/assets
npm --prefix tools/assets run validate:door
npm --prefix tools/assets run prepare:door
npm --prefix tools/assets run validate:door -- --cache ../../assets/door
npm test --prefix tools/assets
```

The [door manifest](assets/door/manifest.json) records original identity and reproducible cache/settings. The [verification record](docs/verification/issue-01.md) explains independent CAD bounds, sampled accuracy, topology limitations and native reproduction commands. The STEP includes a loose construction edge below the actual door; use **surface** bounds for floor placement. Its two tiny omitted faces remain within the measured 5 mm cache tolerance. Preserve original STEP bytes for the separate unchanged download. Door asset verification alone does not establish placement or reach; the issue #3 setup evidence below supplies that separate gate.

## Application stack

The PRD selects React, TypeScript, Vite, direct Three.js, `occt-import-js` in a Web Worker, and Playwright browser acceptance tests. It specifies Node 24 LTS and a committed lockfile. Exact installed browser/build pins and their integration results are recorded in [issue #3 verification](docs/verification/issue-03.md). The [web stack research](docs/research/web-stack.md) remains the baseline for later worker slices; issue #4 implements the local STEP parser worker with the pinned 0.0.23 importer.

The application is a client-side static build. STEP parsing and pose preparation stay local; parser JavaScript and WASM are served as versioned same-origin assets. No backend, account, database, runtime ROS parser, or external conversion service is required.

## Start development

Read the [concise PRD](.scratch/robot-door-scan-demo/PRD.concise.md) first; consult the unchanged [full PRD](.scratch/robot-door-scan-demo/PRD.md) only for additional explanation or ambiguity. Also read the [implementation guide](docs/agents/implementation-guide.md), [robot verification evidence](docs/research/robot-verification.md), and [stack decisions](docs/research/web-stack.md) before implementing. Follow the [ordered issue backlog](.scratch/robot-door-scan-demo/issues/breakdown.md) and select an approved [GitHub issue](https://github.com/K-a-y-C/KaKue/issues) whose blockers are complete. Asset preparation and evidence are prerequisites for accepting work that relies on the real door or runtime robot geometry.

With Node 24 LTS on PATH, from the repository root:

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
PREVIEW=1 npm test
```

Development uses `http://127.0.0.1:5173`; production preview uses `http://127.0.0.1:4173`. The browser tests launch installed Chrome and their own server on port 4174. `dev` and `build` rehash all eight prepared CAD caches and the exact bundled STEP, then stage versioned same-origin caches, source and parser/WASM files automatically; a missing or changed cache fails explicitly. The production build includes browser dependency notices under `demo-v1/notices/`. Refresh returns to the import screen without a scene or scan controls. Choose **Import CAD** to open a workspace or replace the active part with a local `.step` or `.stp` file (case-insensitive, at most 50 MiB). Empty, oversized and unsupported files preserve the active part; eligible imports start a fresh home-pose session and show indeterminate loading. Parsing failure leaves an unready session with import available for recovery. Original source bytes stay in memory for the unchanged STEP download; reload releases the session. All imported parts use the same frozen placement without scaling or automatic positioning. Drag to orbit, right-drag to pan and scroll to zoom. Click visible door skin to append numbered markers and matching XYZ rows (robot-base millimeters, one decimal). Duplicate clicks stay separate. Camera gestures, multitouch, outside releases, foreground robot/scanner/floor and the empty window opening cannot select. Selections are append-only; eligible import or reload clears them. Select one or more ordered points, choose a stand-off from 50–500 mm (default 100) and press **Run**. Controls and selection lock during preparation/movement; completed, blocked and failed sessions cannot rerun. A fresh import restores the validated demo home. The exact supplied door uses its accepted GLB cache only when the selected file SHA-256 matches; its original File remains the download source. Other STEP files use the parser worker. Endpoints and every scan interpolant must meet 5 mm emitter and 5° axis/full-orientation limits before movement. The wrist-attached dense red fan stays on from the first approach through every transition and one-second endpoint dwell; completion, Stop or failure extinguishes it. Stand-off is established on arrival at the first point. Failed preflight leaves the robot at home. Motion uses conservative 10%-rated joint speeds; it makes no collision or controller claim.

To build and verify a non-root deployment, use the same base for build and preview:

```sh
BASE_PATH=/scan-demo/ npm run build
BASE_PATH=/scan-demo/ npm run preview
BASE_PATH=/scan-demo/ PREVIEW=1 npm test
```

The [scanner visit verification](docs/verification/issue-06.md) and [handoff](docs/handoffs/issue-06.md) record bounded pose acceptance, independent math checks, actual dwell observations and production behavior.

The [surface selection verification](docs/verification/issue-05.md) and [handoff](docs/handoffs/issue-05.md) record the picking/gesture tests and independent position/normal fixture.

The [STEP import verification](docs/verification/issue-04.md) and [handoff](docs/handoffs/issue-04.md) record TDD cycles, exact source bytes, independent unit fixtures and production worker/WASM checks. Test failures injected at worker/network seams exercise recovery; successful imports use the real parser.

The [issue #3 plan](docs/plans/issue-03.md), [browser verification](docs/verification/issue-03.md) and [independent setup evidence](docs/verification/issue-03-geometry.md) record exact commands, actual render screenshots, route solutions and sampled clearance. The [fixed demo manifest](assets/demo/manifest.json) freezes a rigid +90° Z door rotation and placement (nearest surface X=1400 mm; floor Z=0). It also freezes a validated retracted demo home with emitter (900,0,800) mm, replacing the source CAD home for this scene after clearance checks. **Use `manifest.homeAngles` for fresh demo sessions**, while `RobotDefinition.home` retains the measured original CAD pose/provenance. No geometry is scaled or substituted.

Independent setup results establish placement; runtime route and complete production acceptance are now retained in the issue #7/#21/#10 evidence. Presenter hardware and production acceptance are now recorded under issue #10 below. Final browser acceptance is Chrome only following the user’s 2026-10-05 clarification.

## Working in vertical slices with TDD

Each issue should deliver one narrow, observable path through the relevant UI, worker, scene, data, and download boundaries. Keep slices independently demoable and implement blockers first. Do a small prefactor first only when it makes the next behavior easier to add safely; avoid separate layer-wide implementation tickets.

For each behavior, use a red–green–refactor loop:

1. Write one failing test of observable behavior through a stable boundary.
2. Implement the smallest complete path that passes it.
3. Refactor while the test stays green, then repeat for the next behavior.

Use the full browser workflow as the primary acceptance seam. Supplement it with independent geometry/coordinate fixtures and downloaded-file readers. Avoid tests that merely duplicate implementation math or assert private component structure. Synthetic STEP fixtures can test errors and accuracy, but cannot replace the supplied door for final acceptance.

Required evidence includes correct surface picking and drag filtering, ordered five-point motion within joint limits, emitter residuals within 5 mm and 5°, truthful blocked/Stop outcomes, identical selected surface coordinates in PLY/CSV, and an unchanged STEP hash. Verify the static production build, target desktop layouts, Chrome (user waived Safari/Edge on 2026-10-05), and the PRD's performance target on the presenter's machine.

## Project references

- [Concise product requirements and acceptance criteria — read first](.scratch/robot-door-scan-demo/PRD.concise.md)
- [Original full PRD — authoritative fallback](.scratch/robot-door-scan-demo/PRD.md)
- [Implementation guide](docs/agents/implementation-guide.md)
- [Ordered issue backlog](.scratch/robot-door-scan-demo/issues/breakdown.md)
- [GitHub issue tracker](https://github.com/K-a-y-C/KaKue/issues)
- [Robot geometry measurements and retained evidence](docs/research/robot-verification.md)
- [Web stack selection and version baseline](docs/research/web-stack.md)
- [Issue tracker configuration](docs/agents/issue-tracker.md)
- [Triage vocabulary](docs/agents/triage-labels.md)

Record source hashes, preprocessing settings, dependency pins, and applicable asset/dependency license notices with implementation. No repository-wide license or permission to redistribute supplied CAD is established by this README.

### Ordered scanner route verification

With Node 24 and Chrome, `npm test -- tests/browser/route.spec.ts` exercises ordered visits, a later actual-door unsolved target blocking all motion, and the five frozen surface-click route. `npm run build` then `PREVIEW=1 npm test` verifies the static production application. `node --experimental-strip-types scripts/verify-runtime-route.mjs` verifies exact CAD/cache identities and solves the frozen surface targets afresh; `node --experimental-strip-types scripts/verify-runtime-route-clicks.mjs` derives the real initial-camera surface clicks. See [issue #7 verification](docs/verification/issue-07.md) for independent Python actual-geometry checks and limitations. No precomputed manifest joint answers enter runtime solving.

### Stop and failure verification

`npm test -- tests/browser/stop.spec.ts` exercises preparation cancellation with delayed native-worker delivery, transit freeze/fresh import, second-dwell visited retention, worker/render errors and queued animation callbacks. `npm run build` then `PREVIEW=1 npm test -- tests/browser/stop.spec.ts tests/browser/motion.spec.ts tests/browser/route.spec.ts` verifies the static Chrome controls and ordered motion regressions. See [issue #8 verification](docs/verification/issue-08.md) and [handoff](docs/handoffs/issue-08.md). Selected data and original source are retained after all outcomes; terminal download controls use the same retained data in #9.

## Continuous scan (#21)

The existing React/TypeScript/Vite/Three.js stack now preflights a surface-position polyline with shortest-arc emitter orientation and the selected normal offset. Intermediate bounded IK waypoints and the actual smoothstep joint interpolants are validated with conservative between-sample error bounds. Opposite-side normals or unsolved transitions block the whole run with a readable point diagnostic. The final user amendment replaces the sheet with a 3D rectangular red volume: 80×60 mm aperture, translucent side walls, 117 rays and a filled 240×180 mm end, with axial reach equal to stand-off, inclusive 50–500 mm. It follows the actual emitter and stays on during approach, motion and endpoint dwells.

```sh
npm run test:numerical
npm test -- tests/browser/scan.spec.ts tests/browser/route.spec.ts tests/browser/stop.spec.ts
npm run build
PREVIEW=1 npm test
```

See the [technical plan](docs/plans/issue-21.md), [verification](docs/verification/issue-21.md) and [handoff](docs/handoffs/issue-21.md). The route follows interpolated selected positions/normals; it does not reconstruct the curved CAD surface between selections. No collision or physical scanning claim is made. #9 exports are implemented; #10 records the static release and local Chrome/presenter acceptance.

## Terminal downloads (#9)

Completed, blocked, stopped and failed results expose three separate buttons: **Download selected points (PLY)**, **Download coordinates (CSV)** and **Download original STEP**. Each click downloads one file. PLY is ASCII 1.0 with only selected surface vertices and unit approach-side normals, in robot-base millimeters with six decimals. CSV contains the same surface coordinates/order plus actual stand-off, separate desired emitter targets, truthful statuses/reasons and visited-only accepted residuals. Unattempted/unsolved/interrupted residuals are empty. The STEP is the exact genuine bundled/imported bytes, retaining the source filename where safe. Camera changes and late cancelled responses cannot change a terminal snapshot; fresh import clears it. Point exports are unavailable without points/source.

```sh
npm test -- tests/browser/downloads.spec.ts
npm run test:numerical
npm run build
PREVIEW=1 npm test -- tests/browser/downloads.spec.ts
```

The [plan](docs/plans/issue-09.md), [verification](docs/verification/issue-09.md) and [handoff](docs/handoffs/issue-09.md) record independent readers, original STEP hash comparisons, terminal failure/cancellation cases and five-point workflow evidence. These are simulated selected CAD coordinates and pose-planning data, not acquired measurements or KUKA programs.

## Verified static delivery (#10)

With Node 24 and the committed lockfile:

```sh
npm ci
npm run build
npm run verify:release
npm run test:release
npm run test:numerical
PREVIEW=1 npm test
npm run test:presenter
npm run preview
```

`verify:release` checks the genuine bundled STEP, eight accepted CAD caches, pinned parser/WASM/notices and compiled local entry/workers, then writes a deterministic `dist/release-manifest.json` containing file sizes and SHA-256. An invalid recheck removes the previous success manifest. To verify a copied release directory, run `npm run verify:release -- --directory /absolute/path/to/release`.

Upload the **complete dist directory** to a static HTTPS host. Serve `.wasm` as `application/wasm`, worker `.js` as JavaScript, and retain all versioned assets/notices. Use a matching `BASE_PATH=/scan-demo/` for a non-root build/preview/tests/release verification. No application server, account, database, runtime CDN or cloud conversion is required. The original STEP remains in browser memory until fresh import/reload.

The release target is current desktop **Chrome**, following your Chrome-only clarification of 2026-10-05. Both 1280×800 and 1440×900 layouts are checked, including resizing and terminal downloads. `test:presenter` opens hardware Chrome instead of SwiftShader, disables Chrome battery-saver/background frame caps in the temporary test browser, and measures the actual five-point route at retina 2× on macOS. The local Apple M1/Chrome 151 measurements passed the **≥30 FPS gate at both sizes** (latest ~30 FPS; earlier ~60 FPS); actual STEP parsing and five-point preflight also remain responsive. Measurements apply to that hardware and those dimensions. On another presentation machine, run the same gate before using it.

See the [technical plan](docs/plans/issue-10.md), [verification/network/performance evidence](docs/verification/issue-10.md), [release inventory](docs/verification/issue-10-release.json) and [handoff](docs/handoffs/issue-10.md). The existing main-bundle size warning is qualified alongside actual transferred byte measurements; npm unpacked size is not a download measurement.

### Rectangular 3D laser projection

The wrist-mounted projection now has a filled rectangular end and visible depth. Its 80×60 mm aperture expands to a 240×180 mm footprint through translucent side walls and a 13×9 grid of rays. These are illustrative dimensions; selected CAD points and all three downloads remain unchanged. Reach follows the accepted 50–500 mm stand-off, and Stop immediately extinguishes the entire volume. [Plan](docs/plans/laser-volume.md), [verification](docs/verification/laser-volume.md), [handoff](docs/handoffs/laser-volume.md).

### Branded import-first workspace

The application starts with the supplied KaKue Automation logo and a CAD import screen. No robot, door, scan controls, CAD asset requests or parser workers appear before choosing a valid model. Successful import opens a compact application header/document toolbar, full 3D viewport and structured scan inspector. Invalid first imports leave the welcome screen available for retry; reload returns to that screen. Model properties are expandable, and the empty selection state explains how to start. The original supplied Logo.jpeg is copied unchanged into src/assets/logo.jpeg and served locally.

[Technical plan](docs/plans/import-first-workspace.md), [verification](docs/verification/import-first-workspace.md), [handoff](docs/handoffs/import-first-workspace.md). The approved source geometry, camera/placement, rectangular laser, Run/Stop and selected-point download contracts remain unchanged. Generic imported parts retain fixed placement and do not imply arbitrary-part reachability.
