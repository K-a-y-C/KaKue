# Issue #10 technical delivery plan

Baseline: completed/reviewed #9 at 4d1d85d, PR #23. User explicitly requested continuing #10 before manual merge, so stack its independent review branch on #9; no main push or automatic merge. Read live #10/#9, concise PRD, implementation guide, actual asset evidence and #9 handoff. Recheck exact source hashes before asset-dependent validation.

## Stack and slice

Keep React/TypeScript/Vite/direct Three.js, native STEP/IK workers, pinned parser/WASM and Playwright. No new framework, library, backend or geometry. This slice delivers a verifiable static release and evidence that the entire actual-asset workflow works from it. The subsequent user-requested 3D rectangular laser projection remains a separate final change.

README records the user's 2026-10-05 Chrome-only browser clarification. Reconcile the older Chrome/Edge/Safari wording in the PRDs with that recorded scope; Chrome is the release target. Keep WebGL2/WASM, both 1280×800 and 1440×900 layouts, actual supplied assets and ≥30 FPS on the local presenter hardware as gates.

## Technical implementation

Add a public `npm run verify:release` command for an already built static directory. Validate bundled original STEP and all eight CAD cache hashes against accepted manifests, parser/WASM/license bytes against pinned installed distribution, required compiled STEP/IK workers and same-origin entry references. Reject missing/corrupt required assets and missing notices. Emit a deterministic `release-manifest.json` enumerating relative file paths, byte lengths and SHA-256, plus pinned versions/source identities. It verifies the final directory independently of the preparation command and supports an explicit directory argument for clean artifact checks. No timestamp/absolute host path; no npm unpacked-size claims.

Add production browser delivery checks for all requests succeeding on the same origin, parser JS/WASM MIME types, worker resolution, cold resource transfer/body sizes, and controls/layouts at both target viewports. Existing #9 independent downloaded-file readers plus actual five-point/Stop/blocked/failed suites remain the full workflow gate. Measure responsiveness during actual STEP parsing and route preflight using animation timestamps/camera interaction, preserving coordinates.

Add an opt-in presenter run in Playwright using normal hardware Chrome (visible, no SwiftShader; Metal on macOS). Record the actual WebGL renderer, browser version, selected route, dimensions, elapsed motion frames and distribution of frame intervals. Measure the full five-point run at 1440×900 and 1280×800; assert ≥30 FPS for the representative active run. Refuse to treat SwiftShader/software rendering as presenter evidence. Preserve the ordinary software-rendered regression mode for reproducibility. Report any genuine hardware/browser limitation honestly.

## Incremental TDD

1. One failing public CLI behavior: build exists but no release verification/manifest command. Add the smallest verifier/manifest implementation and pass. Next, corrupt/delete a required artifact in an isolated copy and verify rejection, then refactor while green.
2. One production delivery browser behavior at a time: real local import requests/MIME and transfer report; then target layout usability. Fix any discovered regression with the corresponding RED→GREEN test.
3. One presenter performance behavior with real hardware rendering and the actual route. Record/resolve any failure, never waive a low measured FPS or invent hardware results. Retain frozen geometry and motion tolerances if a rendering optimization becomes necessary.

## Validation and handoff

Reproduce installation/build with Node 24 and committed lockfile, verify the release, run numerical checks and the complete static-production Chrome suite, including independent five-point PLY/CSV/STEP comparisons and interruption/error paths. Run delivery/layout/presenter checks; verify non-root serving where relevant. Retain release inventory, actual network/performance report, images and existing provenance/pose evidence. Update README with static HTTPS hosting/MIME/command instructions, current browser scope and concrete acceptance evidence. Commit locally, review Standards/Spec, push only the review branch and open a PR based on #9. If a mandatory gate remains unverified, keep #10 open and clearly state it. Then implement/test/review the separate rectangular laser-volume change.
