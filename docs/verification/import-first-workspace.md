# Branded import-first workspace verification

Baseline a59d6b8 / laser PR #25, stacked after #9/#10. User amendment: a presentable software interface, the supplied logo, and no CAD/robot/scan workspace until importing CAD. [Plan](../plans/import-first-workspace.md).

Both exact source hashes rechecked and match the guide. Logo is unchanged: 451×243 JPEG, 16,517 bytes, SHA-256 f81ba9a1604bef4389851fbb4986148d9d042500ff1524d92e38d0764e43f9ed, matching the user-provided Logo.jpeg byte-for-byte. [Logo provenance](../../src/assets/README.md). No generated replacement, new font/image CDN or dependency.

## Incremental TDD

1. Fresh-screen public check was RED: a 3D canvas already existed before choosing CAD. Initialize no scene until a valid first import. GREEN: welcome/branding/import input present, no canvas/Run and no GLB/STEP/WASM/worker requests before selection.
2. Actual renamed supplied CAD opened, but the old layout put the canvas at Y=246 instead of the frozen Y=110. RED public canvas/layout check. GREEN after introducing a 64 px application header, 46 px document toolbar, 310 px inspector and a shrink-safe viewport. The camera/geometry remain unchanged; canvas is 1130×790 at 1440×900 and fits both target sizes. The selected filename is preserved and original bundled STEP is not fetched as a substitute source.
3. First import errors retain the welcome screen and allow retry. Generic valid STEP uses worker geometry and never requests the default door cache/source. Reload returns to the import screen. Latest-import ownership is checked with a held old door-cache request; its later result cannot replace the newer imported box.
4. Existing public replacement checks caught a readiness-guard regression: the guard also suppressed later valid imports, leaving Loading supplied CAD assets. Restrict stale-generation checking to initial boot; allow validated replacements to publish normally. Both focused replacement tests pass. Split permanent pending-import/run cleanup from per-scene disposal while green so first parsing is cancelled on unmount and changing scenes does not abort the newer resolved import.

The first late-loading probe incorrectly held a robot asset needed by both scenes; Three.js coalesces that shared request. Hold the old door cache instead, which the newer generic part does not require. That public ownership check passes. No production workaround or artificial timeout was added for this fixture issue.

## Presentation and contracts

Actual inspected screenshots: [welcome](workspace-welcome.png), [1440 workspace](workspace-imported-1440.png), [1280 workspace](workspace-imported-1280.png). Uses supplied KaKue branding, compact document bar, clear empty-selection state, grouped scanner controls, expandable model properties and viewport navigation hints. No fake menus or nonfunctional controls. Statuses remain truthful simulation outcomes.

InitialPart is either an exact SHA-matched original File plus verified cache metadata, or a genuinely parsed PartAsset. Only the supplied accepted door hash can use its cache; all other eligible STEP files are parsed. File name/bytes remain authoritative for downloads. Part placement/home/mount, rectangular laser, picking, Run/Stop, tolerances and coordinate/export formats are unchanged. Shared browser fixtures explicitly choose the supplied file before exercising prior scan tests. Automatic-start/reload expectations are intentionally superseded and updated.

Build/typecheck passes. Numerical suite: 9 passed. Release CLI: 4 passed against the branded build. Standards and Spec reviews report no actionable findings; Full production suite passed 64 checks, with 19 intentional skips (16 development seams and three opt-in hardware cases). Visible hardware presenter suite passes all three checks; results are below. Earlier slice evidence is preserved, with this slice's reports under workspace/import-first-workspace names.

Browser-tab branding was also checked test-first: expected KaKue Scan Studio initially failed against Robot Door Scan Demo. Updated the HTML title and rebuilt; the final startup/import suite passes all four checks, including that title. Final release verification inventories 25 local files, including the logo, totaling 41,736,713 bytes. Existing main-bundle size warning remains; no dependency added.

Independent production export checks pass for five supplied-door points: PLY/CSV agree with the immutable selected-point snapshot, all five rows are visited, and downloaded original STEP remains 14,456,880 bytes with SHA-256 a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef. [Export report](workspace-exports.json), [completed workspace](workspace-completed-scan.png), [500 mm rectangular beam](workspace-laser-500.png), [beam geometry report](workspace-laser-500.json). Full production route reports preserve 100/500 mm checks under this slice’s names.

## Final hardware production gate

Installed Chrome 151.0.7922.76, visible Metal/Apple M1 rendering, devicePixelRatio 2, the existing presenter scheduling flags: all three checks passed. Actual supplied-door five-point scan at 100 mm visited all five points at both target sizes. 1440×900 averaged 59.859396601594305 FPS (2260×1580 buffer); 1280×800 averaged 59.952097098886675 FPS (1940×1380 buffer), exceeding the unchanged 30 FPS gate. [1440 report](workspace-presenter-1440x900.json), [1280 report](workspace-presenter-1280x800.json). These are measured local Chrome results, not a cross-browser guarantee. Camera changed while five-point preflight remained active, selections stayed intact, animation gap remained below 250 ms, and Stop succeeded: [preparation report](workspace-preparation.json). Earlier laser cadence failures/conditions remain in their original evidence; this UI run does not erase them.

Final checks: full production 64 passed / 19 intentional skips; final branding/startup suite 4 passed; visible hardware 3 passed; numerical 9 passed; release CLI regression 4 passed; build/typecheck and final 25-file release hash verification passed; git diff --check clean. Both independent final Standards and Spec reviews reported no actionable findings.
