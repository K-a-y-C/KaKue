# Issue #3 — actual fixed browser scene

Verified 2026-10-04 against accepted baseline `00e08f7`. Both live asset blockers #1/#2 were manually merged and closed before implementation. This is the static inspection slice; no import, selection, runtime IK, motion, Stop or exports are claimed.

## Source and placement gate

Recomputed exact authoritative input SHA-256 before asset-dependent work:

- `DOOR-of-CAR.step`: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`, 14,456,880 bytes.
- `KR22_R1610-KR16_R1610.stp`: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`, 34,148,428 bytes.

`LC_ALL=C shasum -a 256` avoids the host Perl locale failure under C.UTF-8. Existing door cache and all seven robot GLBs remain byte-identical; the runtime staging script rehashes every cache before serving/building and rejects unavailable/changed files.

The [independent setup record](issue-03-geometry.md) and [frozen demo manifest](../../assets/demo/manifest.json) establish the actual upright placement, candidate route and sampled clearance. The final +90° Z rigid transform has translation `(0.9203385949134826,-2.0353724360466003,-0.367240297)` meters. Visible skin reaches floor Z=0 and nearest surface X=1400 mm; no fit-to-size scaling occurs. The original source construction edge below the skin does not set the floor.

Earlier 900 mm spacing solved endpoint poses but failed actual contact checks; it is not accepted. The accepted manifest freezes a retracted replacement demo home with emitter `(900,0,800)` mm and world-up roll after independent solution/clearance checks. Rendering uses its `homeAngles` with the unchanged shared RobotDefinition/FK. The original measured CAD home remains `RobotDefinition.home` and manifest `sourceCadHomeAngles` for provenance. Later fresh-session/run slices must use the frozen demo home.

Door open-shell/invalid trimming/two tiny omitted tessellation-face qualifications from issue #1 remain. Setup sampled mesh clearance is not runtime collision planning, continuous collision proof, controller validation or physical safety. The accepted runtime five-point route remains issue #7's gate.

## Reproducible browser/build stack

Node 24.19.0 (bundled runtime) was put first on PATH. Exact npm registry pin checks succeeded for React 19.3.0, Vite 8.3.2, React plugin 6.1.1 and Playwright Test 1.63.0; npm resolved/installed the committed lockfile with zero reported audit vulnerabilities. Vite declares Node `^20.19.0 || >=22.12.0`; React plugin declares Vite `^8.0.0`. The installed combination builds and passes browser integration. No research-baseline version substitution was necessary. Browser automation used installed Google Chrome 151.0.7922.76 with `--enable-webgl --use-angle=swiftshader --enable-unsafe-swiftshader`; this is software rendering for deterministic automation, not presenter hardware performance.

Pins: React/React DOM 19.3.0; Three.js 0.186.1; TypeScript 5.9.3; Vite 8.3.2; @vitejs/plugin-react 6.1.1; @playwright/test 1.63.0; @types/three 0.186.0; @types/react 19.2.14; @types/react-dom 19.2.3; @types/node 24.10.1. Runtime dependency license copies are retained in `assets/runtime-notices` and copied to the production static build.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
PREVIEW=1 npm test
```

`dev`/`build` automatically stage verified caches at same-origin `demo-v1/door/door.glb` and `demo-v1/robot/*.glb`. The manifest/RobotDefinition are compiled into the application; static production requests resolve without external geometry/CDN requests. The prepared GLBs total **18,490,828 bytes**; production JavaScript is **868,909 bytes** (Vite gzip estimate 233.31 kB), CSS 1.29 kB, HTML 0.39 kB. A retained [production resource timing record](issue-03-production-load.json) measured ready after navigation at **569.4 ms** on loopback and eight encoded GLB response bodies totaling **18,490,828 bytes**; this is one local software-rendered sample, not remote-network or representative-run performance. The Vite large-chunk warning is retained honestly; code splitting is not required for this narrow scene and no package unpacked size is presented as transfer size.

## Incremental TDD and observations

The technical plan preceded implementation. One public browser behavior was introduced at a time:

1. **RED**: blank starter app had no visible heading/scene (7.1 s failure). **GREEN**: real prepared door/seven robot GLBs, rigid scanner, floor and readable ready UI loaded in Chrome (7.4 s suite). Initial camera fits actual combined world bounds.
2. Missing-cache network failure already produced a generic alert. Refined readable named-asset behavior **RED** expected `Required asset unavailable: door/door.glb`, received raw fetch diagnostic (7.8 s failure). **GREEN**: explicit asset name in the alert, scene unavailable and no false ready state. Network interception is at the external browser request seam only.
3. **RED**: WebGL2 unavailable caused an uncaught renderer-constructor error and absent alert (7.5 s failure). **GREEN**: readable desktop/hardware acceleration requirement and no page error (three-behavior suite 9.5 s).
4. Camera controls shipped with the initial tracer; a regression behavior then exercised actual orbit/right-pan/wheel-zoom. Each gesture changed the rendered image while visible physical measurements remained unchanged. No artificial red was manufactured for behavior already working. An initial 5 s image-poll timeout under software rendering prompted gesture diagnostics/10 s poll/60 s test allowance; focused rerun passed. This test, source inspection showing OrbitControls receives only camera/canvas, and retained visuals jointly support camera-only interaction. Visible measurements alone are not an independent transform audit.

Green refactoring added 500 mm major grid lines, resource cleanup for grids/meshes, floor Z=0 with material polygon offset, direct product prose and stable App/default-export bootstrap. Root identified dev HMR repeated-root warnings when UI and bootstrap shared a file; separating `App.tsx` from `main.tsx` follows the React/Vite refresh seam. React strict-mode cancellation disposes late GLBs instead of inserting them into a discarded scene; each lifecycle owns observer, controls, animation loop, renderer and GPU objects.

Root independently triggered an `App.tsx` hot update after the fix: Vite reported the component HMR update, the browser retained its ready state, and captured warning/error logs were empty. No source content changed during this check.

Final development suite: **4/4 passed, 41.8 s**. TypeScript and static build passed. **Static production preview suite: 4/4 passed, 36.6 s.** The injected WebGL2 failure deliberately triggers Three's constructor console diagnostic, but is caught, has no unhandled page error and never reaches ready. Normal loading has no page errors.

## Actual visual evidence and remaining gates

Retained screenshots at [1280×800](issue-03-scene-1280.png) and [1440×900](issue-03-scene-1440.png) show the supplied robot, actual upright door with empty window, scanner and shared grid. The loading test confirms all eight same-origin GLB requests, visible independent dimensions **1212.5 × 1116.1 mm**, seven core links and validated demo-home emitter **900.0,0.0,800.0 mm**. Screenshots were visually inspected; a canvas/ready label alone is not treated as rendering proof. Root independently inspected development and static production in the Codex in-app browser at 1280×800 with no object clipping and readable panel.

Root also independently reran accepted asset regressions: eight door tests (28.4 s), eight robot tests (81.9 s) and robot TypeScript pass. Independent core reassembly remains 361,773 vertices and maximum 0.000030649679 mm residual. Their cache/source hashes remain unchanged. Root also reran both setup CLI tests (6.8 s) and independently cross-checked the setup solutions with the actual shared TypeScript FK: home emitter/flange matrix discrepancy ≤1.11e-16, maximum route position error 8.869557e-7 mm and orientation error 1.207418e-6 degrees. This reconciles independent setup with the application authority without implementing runtime IK.

Safari smoke, representative runtime motion, exact picking/import/download workflows, and presenter hardware ≥30fps acceptance remain later slices. Software-rendered automated screenshots do not establish presenter performance. Issue #3 remains open for manual PR review/merge; the overall project is not accepted by this record.
