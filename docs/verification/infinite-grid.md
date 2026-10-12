# Infinite viewport grid — 2026-10-12

User-approved amendment: extend only the graph/grid in the 3D viewport. Keep the existing solid base, camera, models, materials, interface and scan behavior.

The two bounded GridHelpers are replaced by transparent world-space 100 mm minor / 500 mm major lines. A camera-centered plane covers all ground visible inside the unchanged 30 m far clip; its footprint moves during inspection while the world-space lines remain anchored. Empty fragments are discarded and subpixel cells fade to avoid a solid fill or horizon aliasing. Grid lines cannot select or obstruct CAD picking. Existing scene disposal releases their geometry and material.

The platform remains the exact existing 4×4×0.18 m solid box with its top at Z=0, original material and opacity. The existing floor is unchanged. No supplied asset, placement, joint chain, camera fitting, controls, export or dependency changed.

## Verification

Node 24.19.0 and installed desktop Chrome, from repository root:

```sh
npm test -- tests/browser/infinite-grid.spec.ts
npm run build
npm run verify:release
PREVIEW=1 npm test -- tests/browser/infinite-grid.spec.ts tests/browser/scene.spec.ts tests/browser/branding.spec.ts tests/browser/selection.spec.ts tests/browser/motion.spec.ts
```

- Red: the new screenshot behavior check found zero grid pixels outside the original square base.
- Green: the same check observes grid lines and more than 60% untouched blue pixels in that exterior region, both initially and after a right-drag pan. Panning creates no surface selections.
- Production Chrome: 21 passed, four development-only fixtures skipped; scene load/error handling, branding at both desktop sizes, orbit/pan/zoom, selection filtering, actual completed visit/home return and blocked import behavior pass.
- TypeScript and production build pass; the existing large-bundle warning remains.
- Static release verification passes: 25 files, 41,749,481 bytes. Preparation verifies all eight CAD cache identities and the exact bundled door source.
- Original sources rehashed: door `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`; robot `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.
- Independent review found no actionable issue in camera coverage, world anchoring, transparency, picking or resource disposal.

## Handoff

This amendment changes the viewport grid only. It introduces no new scan contract or backlog dependency. After the PR merges, GitHub's main-branch Download ZIP includes this change; the existing Node 24 installation/build/start instructions still apply. The camera's existing far clipping remains the visibility limit for all scene geometry.
