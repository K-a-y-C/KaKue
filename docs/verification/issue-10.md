# Issue #10 static demonstration verification

Baseline: #9 at 4d1d85d / PR #23. Both exact source hashes rechecked on 2026-10-05 and match the implementation guide. Geometry, placement, demo home, mount, joint definition and dependency pins are unchanged. [Technical plan](../plans/issue-10.md).

## Incremental TDD

1. Public release command test failed because `verify:release` did not exist. Added verification against accepted STEP/CAD/cache/parser/notices identities, compiled local entry/workers and deterministic file inventory. The empty inline favicon is a local `data:,` URL, not a network dependency; the verifier accepts it. Valid actual static build and repeated byte-identical inventory pass.
2. Corrupting the genuine STEP in an isolated release copy correctly rejected the artifact but left the prior success inventory. The new public test failed on that stale inventory. Remove prior manifest before rechecking; invalid releases now cannot retain success evidence. Both CLI behavior tests pass.
3. Actual static-production import and pose preparation passed same-origin worker/parser/WASM resolution and MIME checks. The browser records response/request body/header sizes (network measurements, not npm unpacked sizes), animation frames during actual parsing and an explicit Stop outcome. [Network/response report](issue-10-network.json).

Browser scope: README records the user's Chrome-only clarification dated 2026-10-05. The previously conflicting PRDs are reconciled with that recorded requirement. Software WebGL regressions remain distinct from the opt-in actual hardware presenter gate.

4. Hardware probes on Apple M1/ANGLE Metal passed about 60 FPS at both viewport sizes, first at 1× and then at the Mac retina 2× pixel ratio. Recording framebuffer dimensions exposed a real resize regression: after shrinking 1440×900 to 1280×800, canvas height remained 790 CSS pixels instead of 690. The new production layout assertion failed (expected 690, received 790). Add only `.viewport { min-height: 0; }` so the CSS grid can shrink below Three.js's previous inline canvas height and ResizeObserver updates the drawing buffer. Rebuild and rerun the target layout/presenter checks before final acceptance; the initial smaller-viewport measurements are not the final accepted layout evidence.

The focused resize recheck passes at both viewports after waiting for the public canvas bounds to settle before the calibrated 1440×900 clicks. The new checks cover growth and shrinkage, exact canvas height, no document-level overflow and all three terminal download controls. Missing WASM, compiled worker and notice cases in isolated static copies also pass rejection tests; release CLI checks now total three.

## Final local hardware/layout evidence

Clean `npm ci` with Node 24.19.0 and the committed lockfile installed 38 packages successfully using an isolated temporary cache. Fresh build/typecheck and release verification passed. The static inventory contains 24 files totaling 41,710,166 bytes, excluding the manifest itself; [inventory](issue-10-release.json). Dependency pins and all source/cache identities remain unchanged. Existing main-bundle warning: ~893 kB raw / 243 kB gzip.

All **5 hardware production delivery checks passed** after the resize fix, including real import/Stop, both layout sizes and both complete five-point routes. Current Chrome 151.0.7922.76 uses **ANGLE Metal / Apple M1**, not SwiftShader. Both benchmarks use devicePixelRatio=2 and record raw active-frame times.

| CSS viewport | Actual canvas buffer | Active-run FPS | 95th percentile frame interval | Maximum frame interval |
| --- | --- | --- | --- | --- |
| 1440×900 | 2260×1580 | 30.000146 | 35.0 ms | 35.4 ms |
| 1280×800 | 1940×1380 | 30.000195 | 35.0 ms | 35.4 ms |

[1440×900 raw measurement](issue-10-presenter-1440x900.json), [1280×800 raw measurement](issue-10-presenter-1280x800.json), [1440 hardware view](issue-10-presenter-1440x900.png), [1280 hardware view](issue-10-presenter-1280x800.png). The smaller canvas now fits correctly after window shrinkage. Target layout images: [1280×800](issue-10-layout-1280x800.png), [1440×900](issue-10-layout-1440x900.png).

Actual hardware STEP parsing takes 14,004.8 ms, with 839 animation frames during parsing and a maximum frame gap of 50 ms. Camera interaction is exercised during loading. All 16 observed responses succeeded on the same origin; parser/compiled workers use JavaScript MIME, WASM uses application/wasm. [Hardware network report](issue-10-network-hardware.json) and [software regression report](issue-10-network.json). The first software run observed 30,186,913 encoded response-body bytes / 30,191,554 response-body-plus-header bytes across the workflow; these are browser request-size measurements, separate from the on-disk release size. Later complete-suite reports may differ slightly due to the new CSS/hash and server headers; raw reports are authoritative.

These FPS/frame measurements apply to the local Apple M1 machine and declared retina viewports. They establish the local presenter gate, not other machines. Chrome is the recorded release target; no Edge/Safari results are claimed. Existing independent source/geometry/pose evidence remains in issues #1/#2/#3/#7/#21; [#9 production files and comparisons](issue-09-production.json) cover five-point exports and source identity.

## Final regression and review

Complete static-production Chrome suite: **60 passed, 18 intentionally skipped**, 10 minutes. The skips are development-only numerical seams and the two opt-in hardware checks, which are run separately on actual Metal. Numerical suite: **9 passed**. Release CLI: **4 passed** after review exposed a missing-entry URL validation gap: one new public test was RED on an accepted nonexistent script, then GREEN after resolving every local entry against the declared `BASE_PATH` and checking its real file. Incorrect deployment prefixes also reject; matching nested bases pass. Historical earlier-slice evidence is preserved.

Standards review identified the entry gap above; Spec review requested retained actual five-point preflight responsiveness evidence in addition to parsing. Both are addressed before commit.

Final repeat: **3 hardware tests passed** (both full-route FPS checks and separate preflight responsiveness). The last route measurements are 30.000146 and 30.000195 FPS, both above the unchanged ≥30 gate. Earlier passes measured ~60 FPS; the measured frame cadence changed during this session. Camera/screenshot-instrumented probes measured 29.903/29.954 and failed; retained [1440 probe](issue-10-camera-capture-probe-1440x900.json) and [1280 probe](issue-10-camera-capture-probe-1280x800.json). Separating screenshot instrumentation from performance sampling passed, but the results do not prove the source of the cadence change or a performance margin on other machines. The table and raw files above are the final measurements, not the earlier faster values.

Actual five-point preflight produced 366 frames over 12,166.4 ms with a 35.4 ms maximum frame gap. Camera PNGs visibly differ during Preparing, all five selections remain, then actual motion begins and Stop terminates it. [Preparation report](issue-10-preparation.json), [before camera](issue-10-preparation-before.png), [after camera](issue-10-preparation-after.png). This separate probe addresses Spec review's missing preflight evidence. Standards re-review reports no remaining findings.
