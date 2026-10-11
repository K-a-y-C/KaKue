# Issue #32 — screenshot branding changes

Applied only the approved title-bar filename removal/title rename, supplied logo in the unused Scan ribbon rectangle after Output, and 3D scene background color. Document-tab and project-outline filenames remain. The small title-bar logo remains. All geometry, camera, command behavior, model materials, grid/platform, and other styling are unchanged.

## Input identity and company blue

Verified actual inputs before browser tests using Node `crypto` SHA-256:

- `3d files/car-front-door-1/DOOR-of-CAR.step`: 14,456,880 bytes; `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- `3d files/Robot/KR22_R1610-KR16_R1610.stp`: 34,148,428 bytes; `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.
- Supplied unchanged logo: `src/assets/logo.jpeg`, 451×243 pixels. See [branding provenance](../../src/assets/README.md).

The JPEG has a blue gradient. Pillow counted RGB pixels in its left blue field, crop `(10, 10, 100, 220)` (right/bottom exclusive): modal RGB `(0, 64, 151)`, 3,344 occurrences. Selected representative company blue is `#004097`. Only `scene.background` changed; floor/platform/model materials did not.

## Sequential TDD evidence

Each new public browser behavior was written and run failing before its minimal implementation; no other behavior tests were written ahead of that cycle:

1. `npm test -- tests/browser/branding.spec.ts`: failed because h1 was `Scan Studio`; renamed it to exact `KaKue scan studio`, removed the filename element and its unused CSS. Same command: **1 passed**. Document/tree filenames explicitly remain verified.
2. `npm test -- tests/browser/branding.spec.ts -g 'supplied logo'`: failed because the Scan ribbon had no logo image. Added the unchanged supplied image after Output with aspect-preserving fit in remaining space. `npm test -- tests/browser/branding.spec.ts`: **2 passed**, including fit at 1440×900 and 1280×800.
3. `npm test -- tests/browser/branding.spec.ts -g 'background'`: screenshot pixel failed with actual `[58, 58, 58, 255]`, the previous gray. Changed only the Three.js background. `npm test -- tests/browser/branding.spec.ts`: **3 passed**; actual rendered screenshot pixel `[0, 64, 151, 255]`.

The background test decodes a screenshot in the browser and reads a known empty background pixel. Reading the live WebGL drawing buffer through a second canvas was unsuitable because its default buffer is cleared; the test was corrected before the production color edit. No test-only application state or renderer setting was added.

## Validation

- `npm run build`: passed TypeScript and static Vite build; existing bundle-size advisory remains.
- Initial red/green tests and development regression used the available PATH Node v22.22.3. The required Node ≥24 runtime was then resolved from bundled workspace dependencies: v24.19.0. The final build and production checks use that supported runtime by prepending `/Users/kayc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin` to PATH. No dependency changes were required.
- Existing filename assertions in scene/import/workspace browser tests were moved from the removed title-bar exact text to the retained document-strip filename. An initial regression attempt exposed those outdated assertions and was stopped; the updated regression was rerun.
- Independent subagent scope review: no findings.
- Development regression: `npm test -- tests/browser/branding.spec.ts tests/browser/ribbon.spec.ts tests/browser/scene.spec.ts tests/browser/ribbon-empty.spec.ts tests/browser/import.spec.ts tests/browser/workspace.spec.ts`: 35 passed, 1 intentional production-only skip, 2 old workspace-locator failures. Those two assertions were updated to scope the original title logo and use the retained custom document filename; `npm test -- tests/browser/workspace.spec.ts` under Node 24: **4 passed**. Across these runs, **all 37 distinct runnable development behaviors passed**. Checks include exact canvas bounds at both desktop sizes, physical surface picks/coordinate preservation, all preview commands leaving joints/camera/downloads unchanged, camera gestures, import workers/units/errors/source ownership, and during-run Stop/settings locking.
- The new duplicate logo means the preexisting welcome-shell assertion now scopes its original small title-bar logo explicitly.
- Production (Node 24): `PREVIEW=1 npm test -- tests/browser/branding.spec.ts tests/browser/ribbon.spec.ts tests/browser/ribbon-empty.spec.ts tests/browser/import.spec.ts tests/browser/workspace.spec.ts -g 'title bar|supplied logo|actual 3D scene background|docked project|preview tabs stay|production import|empty desktop|fresh application'`: **8 passed**. Includes the three requested changes, exact canvas/selection bounds, real Stop/locking, same-origin worker/parser/WASM/exact source import, and empty import-first shell.
- `git diff --check`: passed. Generated historical-named regression screenshots were removed; only the new issue-32 screenshot is retained.
- Visually inspected production screenshot: exact title with no top filename, supplied logo fully visible and undistorted in the right ribbon rectangle, blue viewport and unchanged gray platform/grid/models.

These checks verify this presentation slice; they do not claim new full demo or presenter-hardware acceptance.

[Production screenshot](issue-32-production.png).
