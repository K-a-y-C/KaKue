# Issue #28 — CAD workspace verification

Date: 2026-10-11. Base: main `d112479` (merged PR #27). Runtime: Node 24.19.0, repository's unchanged lockfile, installed desktop Chrome through Playwright. This is a presentation slice; all scene/worker/motion/export modules remain unchanged.

## Sequential TDD evidence

1. `npm test -- tests/browser/cad-workspace.spec.ts`: **red**, actual source imported successfully but the File button in Application menus did not exist. Added the shell/scene tree/workflow tabs and relocated the existing Run/Stop controls without changing handlers or disable conditions. Same test **green**, at 1440×900 and 1280×800.
2. `npm test -- tests/browser/cad-workspace.spec.ts -g 'menus support'`: **red**, Escape left File's `aria-expanded=true`. Added Escape dismissal/focus restoration and outside-pointer dismissal. Shell/menu tests plus existing import-first workspace tests: **6 passed**. A selected surface point and exact joints remain unchanged by menu interaction; placeholders are disabled.

Initial dependency installation/local-server attempts hit sandbox network/bind restrictions; authorized runs outside the sandbox installed the unchanged lockfile and ran Chrome. These infrastructure failures are not behavior-test red evidence. `npm ci` reported zero vulnerabilities.

## Assets

Both supplied files exist in this isolated checkout and were checked before browser work:

- Door SHA-256: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Robot SHA-256: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.

No model replacement, scaling, scene transform or camera change. Canvas bounds remain `(0,110,1130,790)` at 1440×900 and `(0,110,970,690)` at 1280×800. Whole document remains inside each viewport. Scene tree occupies unused upper-left space in the initial presentation view; canvas camera gestures and real surface picking retain their existing handlers.

## Checks

- Build/TypeScript: passed. Existing large main-chunk warning remains (~902 kB minified).
- Numerical suite: **9 passed**, including independent scan pose/stand-off/speed and immutable export checks.
- Release suite: **4 passed**, including missing/altered asset rejection and deployment-base checks.
- Static release inventory: passed, **25 files / 41,747,702 bytes**.
- Full development browser suite: **72 passed / 7 intentionally skipped**, with one 50 mm beam test timing race subsequently corrected and rechecked. The race read dimensions after the one-second dwell had ended and home return reset idle beam telemetry to 100 mm. A browser MutationObserver now captures dimensions/pose together only while the laser is active at the preflighted endpoint; application behavior remains unchanged. `npm test -- tests/browser/scan.spec.ts -g 'mm is accepted' --repeat-each=2`: **4 passed** after the correction (two passes at each range limit). All 73 runnable development behaviors are covered successfully across the full run and corrected targeted repeats.
- `PREVIEW=1 npm test -- tests/browser/cad-workspace.spec.ts tests/browser/downloads.spec.ts tests/browser/scan.spec.ts tests/browser/stop.spec.ts tests/browser/delivery.spec.ts`: **21 passed / 4 intentionally skipped**. Passed actual five-point import/scan/home return/export, 50/500 mm beams, keyboard menus, both desktop layouts, Stop in preparation/transit/dwell/return and failure outcomes. Skips are three explicit presenter-hardware opt-ins and one development-module-only callback fixture (passed in development).
- `git diff --check`: passed.

## Visual evidence

Inspected the [completed scan screenshot](issue-28-completed.png), [1440×900 development screenshot](issue-28-1440.png) and [1280×800 development screenshot](issue-28-1280.png). Menus/title bar, Scan planning tab, fixed scene tree, compact command controls, inspector and viewport strip are readable; no document overflow. The actual supplied robot/door and base remain visible.

Production visuals are [1440×900](issue-28-1440-production.png), [1280×800](issue-28-1280-production.png) and [completed scan](issue-28-completed-production.png). [Production network evidence](issue-28-production-network.json), [release inventory](issue-28-release.json) and [five-point export result](issue-28-scan-results-production.json) retain this run's checks. Historical screenshots and result files from older tickets were restored after test-generated refreshes; only this ticket's evidence is committed. No new native Safari or presenter-hardware FPS acceptance is claimed for this UI slice.
