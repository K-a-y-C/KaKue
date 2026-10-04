# Issue 2 verification — supplied CAD robot

Verified 2026-10-04. This is the robot asset prerequisite, not final acceptance of the complete door-scan application.

## Inputs and reproducible preparation

- Actual robot source: `3d files/Robot/KR22_R1610-KR16_R1610.stp`, 34,148,428 bytes, SHA-256 `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`. Preparation rehashes it before any importer group is used and rejects a different source immediately.
- Pinned joint xacro: revision `07b45e70914e2eb653215de7f95d7e665de9b867`, SHA-256 `64441f6721da5e1f2b7daa487526ec59fb03fcd97a63bfbe5875d324de8cde86`.
- OCCT importer `0.0.23`, millimeters, absolute 1 mm linear deflection, 0.25 rad angular deflection. Fresh import reproduces 81 meshes and 730,266 triangles. Core groups `[73],[8],[6,7],[0,1,2],[5],[4],[3]` retain 461,499 triangles.
- Export each group after inverse home transformation and one millimeter-to-meter conversion. Seven local GLBs total approximately 13.9 MB; each exact byte count and SHA-256 is in `assets/robot/robot-definition.json`. Source/core/local bounds and excluded importer indices are retained in `assets/robot/evidence/preparation.json`.
- Omitted meshes are extra base plates, under-base anchors, ancillary cabling and the over-arm dress attachment. No comparison DAE triangles substitute for supplied CAD geometry. No decimation or fit-to-size scaling occurred.

With Node 24 LTS on PATH:

```sh
npm ci --prefix tools/robot-assets
npm run prepare --prefix tools/robot-assets
npm test --prefix tools/robot-assets
npm run typecheck --prefix tools/robot-assets
npm run test:preview --prefix tools/robot-assets
npm run preview --prefix tools/robot-assets
```

Preview is at `http://127.0.0.1:4172`; the automated preview check uses port 4173 and installed Chrome. Preparation tooling does not establish the future application development/build commands. Dependencies are isolated and locked: OCCT 0.0.23, Three.js 0.186.1, TypeScript 5.9.3, Playwright 1.62.1. The available Playwright version used by the environment was pinned instead of asserting the researched 1.63.0 baseline was installed.

## Independent numeric checks

The first failing public behavior test reported missing robot modules. The minimal implementation made the measured home test green. A second test failed because invalid angles were accepted; interval/nonfinite/vector-length validation made it green. The actual exported-core test failed because preparation was absent, then passed after implementing actual tessellation and GLB export. An invalid-source CLI check failed because its source argument was ignored (it reached parsing instead of immediately rejecting the identity); honoring the optional local input path while retaining the exact hash gate made it green. Additional xacro/CAD/manufacturer and wrist fixtures provide regression coverage.

`robot-source.test.mjs` re-extracts actual STEP cylinder/plane placements rather than using prepared mesh bounds as evidence. It checks A1's Z line, shoulder/elbow Y lines, forearm X line, wrist Y line and flange X-normal plane. CAD lines have arbitrary point/sign; motor-positive signs come from the pinned source. Largest transverse discrepancy is approximately 0.000003067 mm at the wrist, below source uncertainty approximately 0.081886 mm. Static CAD does not establish controller-positive signs or payload variant.

Every compiled origin, identity origin rotation, parent/child, signed axis, hard interval and rated/demo speed is checked against the pinned xacro. The fixed link6/flange identity and flange/tool0 +90° local-Y transform are independently audited there. All six hard intervals/rated speeds also agree with the qualified original-model official KUKA cached numerical evidence. The misleading HTML file formerly named as a PDF is removed; the normalized evidence explicitly states original PDF bytes were not recovered. Manufacturer fact provenance is in `assets/sources/robot-joints/manufacturer-evidence.json`.

Public Float64 FK home predicts shoulder `(160,0,520)`, elbow `(160,0,1300)`, wrist `(815,0,1450)`, flange `(968,0,1450)` and emitter `(1048,0,1450)` mm. The emitter axis is +X. +90° A1 gives flange `(0,-968,1450)` and emitter `(0,-1048,1450)` mm, verifying the clockwise source sign. Independent +90° A5 wrist geometry gives flange `(815,0,1297)`, emitter `(815,0,1217)` mm, optical axis −Z. Scanner mount is rear-face tool0; the 80×60×80 mm box center is tool0 `(0,0,40)` and emitter `(0,0,80)` mm.

An independent binary GLB reader reassembles every one of **361,773 core vertices** using independently specified home placements. Maximum discrepancy against the fresh actual STEP tessellation is **0.000030649679 mm**, due to Float32 render-buffer rounding. Each exported primitive's vertex and index counts agree. This verifies exported geometry against the same selected tessellation, not an exhaustive analytic BREP distance bound; original tessellation/CAD correspondence limitations remain in the retained research reports.

## Articulated preview evidence

The preview imports the same deep-frozen RobotDefinition and Float64 FK as the future application. Each rigid link receives its actual link transform; scanner receives tool0. Original source-core overlay remains static at the supplied pose. Home and A5 articulation were inspected on Chrome **151.0.7922.76**, viewport 1440×900. The automated check asserts both independent emitter positions and return to home, and reports zero page/console/network errors. Screenshots:

- [Home robot and scanner](../../assets/robot/evidence/home.png).
- [Exported home links overlaid on original source core](../../assets/robot/evidence/home-overlay.png).
- [A5 +90° wrist bend with rigid scanner](../../assets/robot/evidence/wrist-bend.png).
- [Node 24 actual-source test run](../../assets/robot/evidence/test-results.txt).

The preview server strips TypeScript only for this preparation harness; issue 3 owns the production Vite build. This check does not claim Safari, production worker/WASM, door clearance, five-point runtime motion, export downloads, or target-hardware performance acceptance. Those gates remain in dependent slices.
