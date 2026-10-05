# Issue #4 handoff — STEP import and fresh model sessions

Implemented on `codex/issue-04-step-import`, based on landed main `f1e8681`, in an isolated worktree. The original checkout's specification edits remain untouched. Read [verification](../verification/issue-04.md) for executed checks and qualified browser coverage.

The operator can choose `.step`/`.stp` case-insensitively. Early unsupported/empty/>50 MiB rejection preserves the active model; eligible import discards the old part/source and starts an indeterminate loading session. Success installs indexed meter geometry at the frozen transform and demo home; failure is explicitly unready and allows retry. A worker owns each parse, and cancellation/settlement terminates it. Request IDs suppress old callbacks. Reload restores the supplied bundled door. Robot/floor/rendering/camera stay active during parsing.

## Public contracts and ownership

- `importStep(file, { signal }): Promise<PartAsset>` in `src/import/step-import.ts` hides source reading, parser startup, transfer, hashing, validation and cancellation. `PartAsset` retains original immutable File/Blob, name/format/hash, declared-unit provenance, meter-output indexed buffers and face ranges, plus frozen column-major placement. It retains the File independently from the transferred parsing buffer. There is no import history or persistence.
- `validateStepFile(file)` is the shared preflight used before the UI abandons a session and by the import interface before file reading. Exactly 50 MiB reaches reading; larger input does not. `StepImportError.code` distinguishes unsupported, empty, oversized, malformed, no-mesh, invalid-geometry, parser-initialization, parser-failure, memory-exhausted and worker-failure. Abort remains a standard AbortError.
- `loadBundledSource({ signal })` fetches and hash-verifies the exact original STEP paired with the cache; no worker parse is required for startup. The scene creates the bundled `PartAsset` from that source and accepted GLB geometry.
- `openDemoScene(host, ready, fail)` now returns `{ clearPart, replacePart, dispose }`; ready receives `(SceneInformation, PartAsset)`. Scene disposal owns GPU resources, controls, animation and initial source-fetch cancellation. Replacement disposes old part geometry/materials. React owns active source and import lifetime; future downloads consume that source. Imports require an initialized base scene.

The robot is static at `manifest.homeAngles` in this slice, emitter `(900,0,800)` mm. Selection/run state does not yet exist; later slices must clear their actual state on eligible replacement and restore this home, then re-test through their UI. No fabricated selection/run controls were added.

## Production and source provenance

`dev`/`build` stage eight verified caches, the exact unchanged bundled STEP, and the pinned unmodified parser at `parser/occt-import-js/0.0.23/`. Parser JS/WASM licenses and generated file-hash provenance accompany those assets. The classic TypeScript worker is emitted as its own same-origin application asset. Every runtime URL honors Vite's base; use the same `BASE_PATH` for build and preview. No runtime CDN/backend is involved.

Unit provenance reads referenced length-unit declarations from STEP global unit contexts and reports mixed/unknown explicitly. OCCT performs normalization via explicit meter output; dimension-based guessing and fit-to-size scaling are absent. Native-CAD-generated fixtures establish equal mm/inch size and known base coordinates. Actual-door source, geometry and responsiveness are verified separately.

## Next work and limits

Issue #5 may build actual door-only selection from the existing viewer. Face ranges are preserved for imported parts; the bundled GLB has no original BREP face ranges. Issue #9 can later consume retained source after its run/download blockers land. Runtime IK, motion, Stop, selections/results and export buttons remain outside this slice. Qualified supplied-door topology/omitted-face limitations remain as recorded in issues #1/#3. Safari/Edge and presenter hardware performance must be recorded honestly at final acceptance; Chrome software rendering is not hardware performance evidence. This handoff does not close the issue or accept the whole demonstration.
