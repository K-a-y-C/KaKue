# Rectangular laser volume verification

Baseline d5dab23 / issue #10 PR #24; preceding issue #9 PR #23. User's final 2026-10-05 visual amendment: a broad 3D projection with a rectangular end rather than a line. [Plan](../plans/laser-volume.md). Both actual source SHA-256 values rechecked immediately before this work and unchanged. Pinned framework/dependencies, geometry, joints/mount, poses, selected-point and download contracts are unchanged.

## TDD and rendered result

Public production Run check at 50 mm was **RED**: expected nonzero `data-fan-height-m=0.18`, actual missing, with the existing 61-ray flat sheet. Replace only the wrist group's laser geometry with a rectangular frustum: 80×60 mm aperture, four transparent side walls plus aperture face, a 13×9 grid of 117 rays, and a filled 240×180 mm end. This is an illustrative beam, not a physical scanner calibration.

The previously failing check is **GREEN**. Next production checks at both 50/500 mm verify geometry-derived height/width, all four end vertices at the actual axial stand-off, dense ray count, locked range, actual accepted emitter arrival and terminal extinction. Continuous two-point motion/transit/Stop remains green. **3 scan tests passed**. Camera zoom changes only the view and leaves selection/target geometry intact.

Inspected actual [50 mm view](laser-volume-50-production.png) and [500 mm view](laser-volume-500-production.png). The latter shows side-wall depth and a filled end covering a rectangular area, rather than a single line. Normal depth testing retains actual door occlusion; polygon offset on the end avoids coplanar flicker. The projection follows the actual wrist transform; no independently aimed or substitute geometry. New mesh/ray GPU resources follow the scene's existing disposal path. Transparent beam meshes remain excluded from picking; they are never selected/exported coordinates.

## Final acceptance

Build/typecheck passed; static release public CLI checks pass against the new bundle. Retain final release inventory, actual five-point exports, browser regressions and hardware report below after they complete. Earlier issue #9/#10/#21 evidence remains historical and is preserved; final rendering evidence uses a separate prefix.

Hardware recheck initially failed at 29.997273 FPS at 1440×900; the 1280 test initially passed near 30. A separate background-throttle probe still failed at 29.997273 / 29.999854 while visible/focused, with frame intervals indicating a ~30 FPS cadence. [Initial probe](laser-volume-throttling-probe.json), [visible 1440 probe](laser-volume-background-probe-1440x900.json), [visible 1280 probe](laser-volume-background-probe-1280x800.json). The machine reported 14% battery while discharging. Final presenter test launch explicitly disables Chrome's BatterySaverModeAvailability and background scheduling caps in its temporary browser; this setting is recorded in raw reports, does not alter normal browser preferences, and retains the unchanged ≥30 FPS assertion. Passing final results below apply to this declared measurement condition; no assertion is made that battery-saving normal Chrome sustains the same cadence.

Final hardware run: **3 passed** with the declared temporary-browser scheduling settings, on Chrome 151.0.7922.76 / Apple M1 / ANGLE Metal. DevicePixelRatio=2; actual drawing buffers are 2260×1580 at 1440×900 and 1940×1380 at 1280×800. Latest actual five-point active-run FPS: **30.000243 / 30.000389**. P95 frame intervals: **35.1 / 35.3 ms**, maximum **35.4 ms**. Both pages reported visible/focused. [1440 raw report](laser-volume-presenter-1440x900.json), [1280 raw report](laser-volume-presenter-1280x800.json). These barely exceed the numerical gate; there is no demonstrated large performance margin. The scheduling flags did not restore the earlier ~60 FPS cadence, so its cause is not established. No gate was rounded or reduced.

Actual five-point preflight remains interactive: **359 frames / 11,933.2 ms**, maximum gap **35.4 ms**, observable camera change with five selections retained, followed by genuine motion and Stop. [Report](laser-volume-preparation.json), [before](laser-volume-preparation-before.png), [after](laser-volume-preparation-after.png). Build and final typecheck pass; **4 release CLI checks pass**, with [final inventory](laser-volume-release.json). Standards and Spec reviews both reported no actionable findings for geometry, mounting, disposal, selection/export exclusions or the amended specification.

Final actual five-point production run completes and independent PLY/CSV readers verify exactly the same five original surface selections/order, correct normals/statuses/100 mm emitter targets and bounded visited residuals. Original STEP output is 14,456,880 bytes with SHA-256 a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef. [Final export comparison](laser-volume-exports.json). All twelve completed/imported/blocked/stopped/failed download checks passed with the 3D beam. Projection vertices/rays are absent from exports.

Final static-production regression command:

```sh
PREVIEW=1 npx playwright test tests/browser/scan.spec.ts tests/browser/selection.spec.ts tests/browser/stop.spec.ts tests/browser/downloads.spec.ts
```

**32 passed / 3 intentional development-only skips**, 6 minutes. Covers both rectangle extremes/continuous motion, door-only selection and camera/multitouch/occlusion rules, actual five-point exports, terminal blocked/stopped/failed imports/downloads, preparation/transit/dwell Stop and worker/render/laser cleanup failures. The development-only seams already pass in #9's complete development suite; #10's complete production suite passed before this visual amendment. No source or dependency files changed. Earlier tracked verification artifacts restored byte-for-byte; final evidence stays under laser-volume names. Documentation now marks old pre-implementation PRD notes as historical and links current delivery evidence.
