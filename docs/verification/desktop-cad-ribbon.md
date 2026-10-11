# Issue #30 — desktop CAD ribbon verification

Date: 2026-10-11. Baseline main: `5d0f941` (merged #28/PR #29). Node 24.19.0; pinned lockfile and installed Chrome via Playwright. This verifies the visual slice against the actual supplied assets.

## Sequential public TDD

Each test was run red before its implementation; earlier tests stayed green.

1. `ribbon.spec.ts -g 'imported actual CAD opens'`: red on the existing title Simulation badge; green after removing it and introducing the default grouped Scan ribbon with existing real controls.
2. `-g 'workflow previews'`: red because Geometry did not switch command groups; green after selectable tabs, safe preview callbacks, transient three-second status, menu keyboard/Escape dismissal and focus handling.
3. `ribbon-empty.spec.ts`: red because the welcome page lacked the empty desktop shell; green after keeping ribbon and docked workspace visible before import, disabling real scan commands and retaining no-CAD/no-worker bootstrap.
4. `-g 'stand-off editor'`: red because no distance dialog existed; green after validated 50–500 mm Apply, Cancel, Escape and focus restoration. A draft does not become a second committed scanner value.
5. `-g 'docked project'`: red on the missing actual source/tree filtering; green after the project outline, properties/data tabs, document strip and renderer-sized workspace. Both requested desktop sizes pass layout/overflow checks and actual supplied surface selection.
6. `-g 'preview tabs stay'`: red because switching away from Scan hid Stop; green after retaining a real active-sequence Stop group on other tabs. Settings/import locks and terminal statuses remain enforced.

7. Final screenshot inspection found the surface-selection label wrapping to three lines. The enhanced `docked project` check failed with 3 lines against the two-line maximum; widening that one command passes at both sizes. Disabled surface-selection commands also stop showing an active blue state.

The complete preview-command safety test activates every listed ribbon/menu/quick-access/view/visibility command and verifies unchanged selected coordinates, stand-off, joints, laser, camera image and zero downloads. It passes with a 90-second allowance for the complete interaction inventory.

The initial sandbox server-bind failure was an infrastructure limitation, not behavior-red evidence. Authorized local-server/Chrome runs provided the red/green results above.

## Assets, geometry and fixtures

Verified before browser work and retained in [numeric/release evidence](ribbon-evidence.json):

- Door: `3d files/car-front-door-1/DOOR-of-CAR.step`, SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Robot: `3d files/Robot/KR22_R1610-KR16_R1610.stp`, SHA-256 `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.

Source meshes, physical dimensions, transforms, camera pose/FOV, scanner mount, joint definition, workers, picking/motion and export serializers are unchanged. Scene edits only adjust viewport/floor/grid colors. The existing ResizeObserver now sizes the docked canvas to `(221,188,948,688)` at 1440×900 and `(221,188,788,588)` at 1280×800. The page does not scroll; panes scroll independently.

`scene-clicks.ts` reprojects the independently recorded old camera-space hits into the actual canvas rectangle, scaling by its height under the unchanged vertical FOV. This preserves the physical surface locations, rather than moving models to fit old coordinates. The five-point reference coordinates remain within 0.15 mm; independent emitter checks during development observed maxima of 0.0756 mm / 0.06695° at 100 mm and 0.1123 mm / 0.06783° at 500 mm. Bounds/speeds and continuous beam/dwell assertions pass. These are simulation/CAD checks, not physical scanner measurements.

## Checks and corrections

- Final build and TypeScript pass; retained large main-chunk warning (~908 kB minified).
- Numerical suite: 9 pass. Release suite: 4 pass. Final release inventory: 25 files / 41,748,267 bytes.
- Full initial development browser run: 75 pass / 7 intentional skips / 3 test failures. The failures were the old inspector-only export-region assertion, a home pose captured after motion had begun, and a real STEP reparse exceeding its old 20-second allowance. The export assertion now targets the Output ribbon while retaining independent ZIP parsing; home is captured before Run; actual parsing/retry uses the existing 45-second import allowance and 60-second scenario timeout. No motion/import implementation was changed to make these checks pass.
- Focused corrected development run: 9 pass, with the new full preview inventory hitting its default 30-second test budget. That inventory passes separately after giving its many UI activations 90 seconds. Together all 80 runnable development behaviors are verified across the broad run and focused corrections; seven explicit production/hardware gates are intentionally skipped in development.
- `PREVIEW=1 npm test -- tests/browser/ribbon.spec.ts tests/browser/ribbon-empty.spec.ts tests/browser/cad-workspace.spec.ts tests/browser/downloads.spec.ts tests/browser/scan.spec.ts tests/browser/stop.spec.ts tests/browser/delivery.spec.ts`: **28 pass / 4 intentional skips**. Real worker/WASM import, actual five-point scan/home return, independently parsed CRC-checked PLY/CSV ZIP, range endpoints, all ribbon/preview behaviors and preparation/transit/dwell/return/failure Stop paths pass. The four skips are three hardware opt-ins and one Vite-only callback fixture, verified in development.
- Final rebuilt static release after label refinement: **5 production layout/lock tests pass**, with fresh import and viewport-relative surface picking directly at both desktop sizes. This recaptures empty/imported/running/completed states and checks major labels use at most two lines.
- Final `git diff --check`: passes. Original ticket verification artifacts are restored; only this slice's evidence is committed.

## Visual evidence

The supplied reference was inspected directly. Its dark dense application surface, grouped commands, selected tabs, docked outline and framed viewport guided the shell. Browser/macOS controls and unrelated industrial/scientific content were excluded.

Inspected empty ([1280](ribbon-empty-1280-production.png), [1440](ribbon-empty-1440-production.png)), imported ([1280](ribbon-imported-1280-production.png), [1440](ribbon-imported-1440-production.png)), running ([1280](ribbon-running-1280-production.png), [1440](ribbon-running-1440-production.png)), and completed ([1280](ribbon-layout-1280x800.png), [1440](ribbon-layout-1440x900.png)) production screens against the supplied reference. Major commands, Stop, coordinates/statuses and all three workspace regions fit; no page overflow. The final label and disabled-state refinement is included in these recaptured screenshots.

[Network/worker evidence](ribbon-network.json) records the production run before the final CSS label refinement; the final build inventory is in `ribbon-evidence.json`. [Release and independent pose summary](ribbon-evidence.json), [development archive evidence](ribbon-results-development.json) and [production archive evidence](ribbon-results-production.json) retain the verified outputs. No new native packaging, Safari or presenter-hardware FPS acceptance is claimed. Historical verification artifacts from older issues are preserved.
