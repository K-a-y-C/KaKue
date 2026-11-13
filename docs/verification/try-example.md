# Try example — verification

Scope: the user-approved [example-start plan](../plans/try-example.md), based on main `3e1e32b`. Remove both visible logos. An explicit opening **Try example** action loads the exact supplied door automatically; local Import CAD remains available. All subsequent selection, simulation and successful-scan ZIP export use the existing workflow.

## Input identity

Recomputed with Node 24.22.1 `crypto.createHash('sha256')` before asset-dependent work:

| Input | Bytes | SHA-256 |
| --- | ---: | --- |
| `3d files/car-front-door-1/DOOR-of-CAR.step` | 14,456,880 | `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef` |
| `3d files/Robot/KR22_R1610-KR16_R1610.stp` | 34,148,428 | `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1` |

`prepare:assets` also verified all eight accepted geometry caches. No geometry was substituted or regenerated. The built application no longer references the logo image; its original provenance remains as historical source material.

## Sequential TDD

1. Changed the public branding test to require zero KaKue images at 1440×900 and 1280×800. Before implementation: failed, expected 0 images, received 2. Removed title/ribbon image imports and render paths plus unused CSS. Same test: **1 passed**.
2. Added the public “Try example → actual supplied door → select → Run → complete” behavior. Before implementation: failed because the button did not exist. Added the opening button and connected it to `loadBundledSource` and `InitialPart.cacheSource` through the existing import session's generation/abort/error handling. Same test: **1 passed**, including independently requested HTTP source SHA-256, scan completion/Export enablement, and reload back to the opening choice.
3. Added missing-source / wrong-hash / retry behavior; it passed against the existing shared failure handling without further implementation.
4. Added example-source versus local-import ownership race coverage; it passed against the existing shared cancellation/generation checks without further implementation.
5. Added both desktop layouts and keyboard activation coverage. The shared scan fixture now explicitly clicks **Try example**, so the broad scene/selection/motion/Stop/export regression exercises the new entry point. Direct local-import tests remain.

The initial network assertion attempted to read the large browser response body before scene readiness and received an empty DevTools body. The final check uses an independent HTTP request after readiness, matching the established production source-identity check; the runtime loader independently verifies the actual fetched source hash before accepting it.

## Checks

All commands use Node 24.22.1 on PATH, the locked dependencies and installed Chrome, from the isolated `codex/try-example-start` worktree.

- `npm run build`: **passed**, TypeScript and static build. Existing large-chunk advisory remains. The emitted entry, two local workers, CSS, same-origin CAD, parser/WASM and notices are present.
- `npm run test:numerical`: **9 passed**, including independently verified motion, residuals, speed/joint bounds, both stand-off endpoints and exports.
- `npm run test:release`: **4 passed**, including deterministic inventory, changed/missing release rejection and deployment-base checks.
- `npm run verify:release`: **passed**, 24 files / 41,733,465 bytes.
- `npm test`: **87 passed, 7 intentional production/hardware skips** (94 collected before the final desktop/keyboard test was added). Final focused development example/branding rerun: **7 passed**, including the added keyboard/desktop test.
- Production browser workflow and layout checks: **20 passed, 3 intentional hardware skips**. Ran `PREVIEW=1 npm test -- tests/browser/example.spec.ts tests/browser/branding.spec.ts tests/browser/workspace.spec.ts tests/browser/delivery.spec.ts tests/browser/downloads.spec.ts` with a temporary config changing only the preview port to 4175 and results directory so it could run independently of development on 4174. Checks include actual five-point completion and independent ZIP/CSV/PLY validation, worker/WASM MIME/origin, both desktop sizes and both entry paths.
- After visual review, made the example button's border/fill explicit using the existing selected-command colors. Rebuilt and reran production `example.spec.ts` and `branding.spec.ts`: **7 passed**. No runtime logic changed in this final styling pass. Release inventory above is from that final rebuild.
- Independent source/coverage/plan/design review: **no actionable findings**. The new path shares the accepted scene pipeline and session ownership rather than duplicating parsing or geometry handling.

## Retained evidence

- [Opening screen, 1280×800](try-example-welcome-1280-production.png) and [1440×900](try-example-welcome-1440-production.png).
- [Loaded example, 1280×800](try-example-loaded-1280-production.png) and [1440×900](try-example-loaded-1440-production.png).
- [Five-point archive validation](try-example-results-production.json) and [actual exported ZIP](try-example-results-production.zip).

The opening and loaded screenshots were visually inspected. The keyboard-operated primary action fits without page scrolling at both sizes, and the supplied robot/door are recognizable with both logos absent.

## Limits

This is Chrome automation using software WebGL. It does not constitute a new Edge/Safari, visible presenter-hardware FPS, physical scanning, controller or collision-safety acceptance claim. Existing issue #10 delivery qualifications remain. Package version stays `0.1.0`; this repository has no VERSION/CHANGELOG release convention, so introducing a new release scheme is outside this UI slice.
