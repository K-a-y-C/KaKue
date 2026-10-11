# Issue #32 — screenshot branding changes

User-approved scope, 2026-10-11. Baseline: merged main `c84e179`, containing issue #30 / PR #31's desktop ribbon. [Issue #32](https://github.com/K-a-y-C/KaKue/issues/32) tracks this single presentation slice.

1. Remove the top title-strip filename area and set its heading to exactly `KaKue scan studio`. Keep the existing small title-strip logo and filenames in the document strip and project outline.
2. Display the unchanged supplied KaKue Automation logo in the unused ribbon rectangle after Output. Preserve its aspect ratio and all existing command groups, controls and workspace dimensions.
3. Sample the supplied logo's company blue and use it only for the rendered Three.js scene background.

For each behavior, write one failing public browser test, observe the failure, implement the smallest change, then verify green before adding the next test. Use the supplied STEP and verify source hashes before asset-dependent checks. No dependencies, geometry, camera, workers, motion, exports or unrelated styles change.

An implementation subagent owns source/tests and verification; an independent reviewer inspects scope. Final checks cover the three behaviors, existing ribbon/import interactions and production build/preview. Retain a production screenshot, verification commands and issue handoff; update README with this amendment. Publish only a review branch/PR and leave merge to the user.
