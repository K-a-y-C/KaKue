# Issue #4 verification — local STEP import

Implemented 2026-10-05 on `codex/issue-04-step-import`, based on main `f1e8681` (landed issue #3). Closed blocker deliverables #1/#2/#3 and their verification/handoffs were read. Both supplied STEP hashes were recomputed before asset-dependent work and match the implementation guide:

- Door: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`, 14,456,880 bytes.
- Robot: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`, 34,148,428 bytes.

All prepared CAD caches and the placement/home manifests remain unchanged. The original dirty checkout remains untouched; work is isolated at `/private/tmp/kakue-issue-4`.

## Incremental TDD evidence

One public behavior test was added/run before each corresponding implementation, followed by minimal passing code. No suite was written upfront. Successful imports use the real published parser. Fault injection is confined to browser Worker and same-origin parser/network seams; there are no test-only application globals.

1. Tracer RED: no accessible Import STEP control (30-second timeout). GREEN: real classic worker/file/parser/PartAsset/scene replacement; independently known box remains 100 × 200 × 300 mm at frozen placement.
2. Units RED: inch provenance incorrectly reported millimeter. GREEN: provenance reads referenced context length units. Fixture generation initially revealed native writer unit-setting order and lack of automatic numeric coordinate conversion; the fixture was corrected and independently reopened before accepting expectations. Equivalent inch/mm boxes now match known physical and base-frame bounds.
3. Source RED: bundled source interface absent. GREEN: retain exact source Blob separately from transferred parser buffer and verify bundled source against its manifest. Public interface tests compare every retained fixture byte and SHA-256.
4. Replacement race/reload test passed existing ownership/cancellation behavior; no artificial failure manufactured. A queued old worker failure after cancellation cannot overwrite the newer model. Reload restores actual bundled door/home.
5. Unsupported RED: CATPart treated as malformed STEP and replaced the active session. GREEN: preflight preserves the current model. Size RED: >50 MiB reached file reading. GREEN: cap precedes reading/worker; exact limit reaches read. Empty RED: generic malformed outcome and lost model. GREEN: empty preflight preserves model. Real malformed and independently valid no-surface STEP passed distinct errors/recovery already established in the tracer.
6. Missing-WASM RED: raw engine diagnostic. GREEN: readable parser/WASM initialization category and retry. Worker error already passed; allocation RED: raw allocation diagnostic. GREEN: recognized memory-exhaustion category (generic crashes remain worker failure). Worker startup RED: raw SecurityError. GREEN: readable worker category and retry.
7. Geometry RED: invalid indices installed as ready. GREEN: validate finite coordinates/normals, array lengths and raw indices before typed conversion. Degenerate-only RED: ready with no usable triangles. GREEN: require nonzero triangle area. Float32 overflow RED: incorrectly classified no-mesh. GREEN: reject nonfinite converted render buffers as invalid geometry.
8. Actual supplied-door UI test passes real parsing, accepted dimensions/home and an observable camera-image change while status still says loading. No parser percentage is fabricated.
9. Production RED: inline data-URL classic worker could not complete import. GREEN: emitted same-origin worker asset. Production checks observe actual parser JS/WASM responses, `application/wasm`, worker origin and source SHA-256. Non-root preview initially used a mismatched server base; configuring the same BASE_PATH for build/preview made both actual-door and resource checks pass at `/scan-demo/`.
10. WebGL regression RED: import enabled without a usable base scene. GREEN: import remains disabled until base initialization succeeds.
11. Public reason-code RED: oversized error had no code. GREEN: stable StepImportError codes, retaining plain-language UI messages.

Green refactoring type-checks the classic worker as TypeScript, terminates/settles each worker once, centralizes manifest source identity, and preserves the small importer/scene interfaces. [Fixture provenance and independently known coordinates](../../tests/fixtures/README.md) distinguish synthetic checks from the actual supplied-door gate.

## Executed checks

Node 24.19.0 bundled runtime was put first on PATH; root locked dependencies were installed and occt-import-js added at exact 0.0.23. No other dependency pins changed; npm reported zero vulnerabilities. Baseline four scene tests passed before import work (55.8 s), and baseline TypeScript/build passed. Browser automation uses installed Chrome with SwiftShader flags from the existing test configuration.

The initial integrated development run passed 20 tests with one production-only skip (1.6 min). Final integrated checks passed:

```sh
npm test                                     # 23 passed, 1 production-only skip; 2.0 min
npm run build                                # TypeScript + root static build passed
PREVIEW=1 npm test                            # 19 passed, 5 public-module skips; 1.6 min
BASE_PATH=/scan-demo/ npm run build           # non-root static build passed
BASE_PATH=/scan-demo/ PREVIEW=1 npm test -- import.spec.ts -g 'production import|actual supplied door'
                                             # 2 passed; 26.2 s
npm run build                                # root build restored
```

A final clean Node 24 `npm ci` (zero reported vulnerabilities), TypeScript/build, and focused queued-success/failure replacement check also passed (1 test, 11.1 s).

The five production skips are public importer-module integration checks run through Vite's source-module route in development: mm/inch/base-coordinate equivalence, fixture byte ownership, pre-read size cap, stable reason code and actual-door byte/base-geometry contract. Production independently exercises real inch/door UI imports, loading/responsiveness, source identity, all UI failures/recovery, stale callbacks and same-origin resource/MIME paths. The race regression includes both already queued stale failure and success after cancellation. Skips do not hide a failed acceptance test. The Vite large-JavaScript-chunk warning persists; it is not treated as a parser failure or hidden.

The retained [root production sample](issue-04-production-import.json) measured 14,060 ms for that workflow; no page errors. Full-page [1280×800](issue-04-layout-1280.png) and [1440×900](issue-04-layout-1440.png) production images were visually inspected: file control, status and measurements are readable; the short viewport has a scrollable side panel.

The retained [non-root production sample](issue-04-non-root-import.json) measured 14,263 ms from file-input upload through ready checks, including screenshots/camera gestures, and no page errors. This is one loopback/software-rendered sample, not parser-only timing or presenter hardware performance. The [imported-door image](issue-04-imported-door.png) was visually inspected: actual upright door/window, supplied robot, scanner and floor remain recognizable.

Raw staged parser payload sizes are 96,871 bytes JavaScript plus 7,604,031 bytes WASM (loaded on import). Startup CAD cache files total 18,490,828 bytes and unchanged STEP is 14,456,880 bytes. The root app JavaScript build is ~873.97 kB, worker ~2.94 kB, CSS ~1.42 kB; these are raw production artifact sizes, not a remote-network timing claim.

Parser file sizes/hashes, locked archive integrity, fixture hashes, Chrome version and unavailable-browser reasons are retained in [provenance](issue-04-provenance.json).

## Acceptance scope

Actual supplied geometry is used in development and production; synthetic files are additional tests only. Public actual-door source/geometry checks compare retained bytes, required SHA-256, known accepted base bounds within 5 mm, millimeter provenance and retained BREP face ranges. Prior native source/cache/tessellation qualifications remain. Camera interaction during loading is tested by changing the actual canvas while loading is still observable.

Selection/result clearing needs UI regression once later slices supply those states. The static robot remains at verified demo home throughout this slice. No runtime IK/motion/Stop/exports or complete-demo acceptance is claimed. Chrome is the executed browser. Native `/usr/bin/safaridriver` was attempted and refused session creation because Safari Settings have 'Allow remote automation' disabled; no browser settings were changed. Microsoft Edge is not installed in `/Applications`. Edge/Safari and presenter hardware ≥30 FPS remain explicitly unverified here and part of final delivery's browser/hardware gate. The issue remains open for review; no automatic closure/merge occurred.
