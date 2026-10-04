# Issue #3 handoff

Delivered the first React/TypeScript/Vite/direct Three.js application: actual prepared fixed door, seven supplied-CAD robot links, rigid scanner, shared 100 mm/500 mm grid and floor Z=0, orbit/pan/zoom, loading/asset/WebGL2 outcomes, root lockfile/build/test commands and runtime notices. Read the plan and `docs/verification/issue-03.md` plus the independent geometry record.

With Node 24 on PATH: `npm ci`, `npm run dev`, `npm run build`, `npm run preview`, `npm test`, `PREVIEW=1 npm test`. Tests use installed Chrome and their own localhost port4174. `dev`/`build` hash-gate and stage eight exact CAD caches to `public/demo-v1`; production serves them unchanged from same origin.

The scene lifecycle interface `openDemoScene(host, ready, fail)` returns full cleanup. React owns status/error UI; Three owns GPU resources/camera/rendering. There is no test-only global scene handle. Existing immutable RobotDefinition and Float64 FK are reused; visual transforms are applied once. The renderer and source assets retain physical dimensions.

`assets/demo/manifest.json` freezes rigid `partToBase`, replacement demo `homeAngles`, references to accepted source/cache manifests, five independently solved actual-surface points and sampled clearance evidence. **Fresh sessions and future runs must use this demo home**, emitter `(900,0,800)`mm. Original `RobotDefinition.home` is the measured CAD provenance pose; its direct transition was unsuitable at closer placement. Do not recompute a different placement or rescale the door. The scanner mount remains unchanged.

Qualified open-shell/tiny-face/source CAD and manufacturer limitations persist. Five-point setup solutions and sampled clear meshes are not runtime solver, continuous collision or final workflow acceptance. Later issue #7 must reconcile runtime solutions/route with this frozen evidence.

Next unblocked work after the user's manual issue #3 PR merge: issue #4 browser STEP import/fresh session and issue #5 door-only ordered selection. Preserve current scene, same-origin build behavior and cleanup while adding those complete behavior slices. No imports, point selection, run/laser motion, Stop or downloads are implemented prematurely. Root handles review, local commit, review branch push and PR; no automatic merge or dependent issue starts before manual acceptance.
