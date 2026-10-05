# Issue #9 technical implementation plan

Base: merged issues #4, #8 and #21 at `c2b4494`; issue #9 stories 29–34. Implement in the clean `codex/issue-09-download-snapshot` checkout. Preserve unrelated work in the original checkout.

## Framework and scope

Keep installed React 19.3, TypeScript 5.9.3, Vite 8.3.2, direct Three.js 0.186.1 and Playwright 1.63 with Node 24. No new runtime dependencies, worker, backend or geometry changes. React owns the terminal download controls; native Blob/object URL/download APIs deliver files. Existing local STEP and IK workers remain unchanged. Issue #21's actual 50–500 mm stand-off and original selected points feed exports; intermediate scan waypoints and laser meshes never enter them.

## Interface and data flow

Add a cohesive export module with a small interface: capture a DownloadSnapshot from retained PartAsset, selected points, terminal UI statuses, RunPlan and run outcome; serialize PLY/CSV from that snapshot. Copy/freeze point arrays and terminal fields; retain the immutable original source Blob and identity. Capture on the terminal React commit after statuses settle, once per session; clear on eligible replacement. Repeated separate downloads use identical data, regardless of camera changes or late cancelled responses.

PLY is ASCII 1.0, exactly one double XYZ/normal vertex per original selection, no faces; six decimal values in robot-base mm, with frame, units, approach-side normal, source name/hash and simulated-selection metadata. CSV has the exact 18 PRD columns, shares surface serialization/order with PLY, records actual stand-off and separate desired emitter targets. Only visited points receive accepted endpoint residuals; unattempted, stopped and unsolved residuals remain empty. Application-controlled reasons are escaped as rectangular CSV. Reject nonfinite coordinates/targets/residuals before generating misleading files. Use deterministic metadata and locale-independent decimal points.

Expose three separate terminal controls for completed/blocked/stopped/failed: Download selected points (PLY), Download coordinates (CSV), Download original STEP. Disable point files with no points, and STEP when source is unavailable. Preserve STEP bytes and basename/extension where safe; sanitize coordinate basenames. One click produces one download, with object URL cleanup after initiation and on unmount/replacement. Show readable export failures without altering the run outcome.

## TDD sequence

Write and run one failing public behavior test, implement the smallest passing path, then repeat. Planned behaviors (not tests written upfront):

1. Complete an actual supplied-door visit and independently parse a downloaded PLY, checking selection-only vertices, exact schema, coordinates/normals and metadata.
2. Download CSV and independently parse rectangular rows, exact columns, matching PLY coordinates/order, emitter targets, actual 500 mm stand-off and visited residuals.
3. Download genuine bundled/imported STEP separately and compare SHA-256 and filenames against input; inspect download event counts and object URL release.
4. Block a route and Stop preparation/movement/dwell; export every retained selection with honest diagnostics and empty unattempted residuals; reject late responses and prove repeated downloads stable.
5. Fail a worker/execution path, including after a visit; retain all rows/source and truthful outcomes. Exercise zero-point/unavailable-source controls, safe filenames/metadata/CSV text and invalid numeric input through the public export interface as supplemental fixtures.

Refactor only while green. Use actual supplied assets for browser acceptance; known STEP fixtures supplement imported-file/error cases. Mock only worker/render/timer/browser URL seams for failure/race/resource checks. Independent file readers do not call production serializers or motion math.

## Verification and delivery

Verify both exact source hashes before asset-dependent work. Run targeted tests after each TDD increment and regular TypeScript checks, then numerical regressions, the complete Chrome browser suite, static build and production download workflows (including five actual points). Record red/green evidence, commands, qualified results and remaining #10 presenter acceptance in docs/verification/issue-09.md. Update README and docs/handoffs/issue-09.md. Review against merged main, commit only issue #9 changes locally, push the review branch and open a PR. Do not merge or close acceptance with unverified requirements.
