# Issue 7 runtime route geometry reconciliation

The runtime gate uses the five frozen actual door surface positions/normals and the validated demo home from `assets/demo/manifest.json`. `scripts/verify-runtime-route.mjs` calls the application's current bounded solver afresh; it does not pass or substitute frozen setup joint solutions. All actual input STEP and prepared mesh bytes are rehashed before use. Door SHA-256 remains `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef` (14,456,880 bytes); robot remains `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1` (34,148,428 bytes).

The first recorded five-target solver pass took 87.7ms in bundled Node24. All five endpoints are Ready and finite, with maximum independently recomputed emitter position error 0.033560mm, full orientation error 0.049926° and optical-axis error below 5°. NumPy verification uses the separately specified measured/source joint chain in `tools/scene-setup/verify.py`, including the independent +90° Y emitter orientation and +80mm flange-X mount. Full orientation and optical-axis residuals are recalculated from surface position/normal and 100mm stand-off rather than trusting solver-reported errors. Surface positions remain unchanged.

The least-displacement runtime solver selects a different wrist branch from the original setup answers: A4/A6 differ by approximately ±π radians and A5 changes sign, with maximum joint displacement from setup 3.149844rad. Therefore the original issue3 clearance report alone does not establish the runtime path. `scripts/verify-runtime-route-clearance.py` applies fresh runtime answers and the existing independent actual-mesh contact method from `tools/scene-setup/clearance.py`: 21 fractions per transition, shared endpoints counted once, for 101 unique joint poses. All intermediate samples are finite and within authoritative hard joint intervals. Analytic smoothstep velocity at those samples remains within conservative 10% rated joint speeds (maximum ratio 1.0000000000000002, floating-point roundoff). The corresponding segment durations are 5.932151, 2.918054, 1, 2.233804 and 2.075286 seconds, excluding the one-second visual dwell per endpoint.

Actual door triangles, all seven robot-link GLBs and the actual 80×60×80mm scanner box are tested with VTK first-contact checks. AABB filtering only excludes disjoint triangles. The runtime path produces zero sampled robot/scanner-to-door contacts. Minimum robot/scanner world Z is −9.2374e−17m at the fixed base, numerical zero. This reconciles the runtime solver path with the setup geometry gate; it is finite sampling, not continuous collision detection, self-collision testing, physical-cell safety, arbitrary-point guarantees or runtime collision planning.

Evidence: `issue-07-runtime-route.json` retains the fresh public preflight answers and source identity; `issue-07-runtime-route-clearance.json` retains independent endpoints, comparison with setup joints, all 101 samples, durations, speed ratios and contact verdicts. Browser route click/animation acceptance is additionally recorded by the issue owner and must agree with these supplied surfaces and runtime endpoints.

`verify-runtime-route-clicks.mjs` independently rebuilds the initial camera bounds from actual loaded GLBs, home joint matrices, scanner, emitter and hidden laser (initial scale Z=.1), then projects frozen surface points into the 1440×900 default browser viewport. It also raycasts the actual door at each projected location: nearest-surface position errors are below 1e−10mm. The renderer canvas is x0/y110/width1130/height790. Browser clicks must use fractional screen coordinates to preserve these exact selected locations; rounded display-list values alone are insufficient for endpoint verification.

Reproduce from the repository root:

```sh
/Users/kayc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/verify-runtime-route.mjs
/Users/kayc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/verify-runtime-route-clicks.mjs
/private/tmp/kakue-door-cad-venv/bin/python scripts/verify-runtime-route-clearance.py
```

The isolated Python environment uses NumPy and VTK 9.3.1; they do not enter the browser runtime or dependency lockfile. Browser/production acceptance remains the public UI gate; this numeric tooling complements it.

## Production Chrome observations

The production public browser test records actual selected positions/normals and articulated emitter/joint samples in `issue-07-browser-route-production.json`. `verify-runtime-route-clearance.py --browser docs/verification/issue-07-browser-route-production.json` extracts the first laser-on endpoint for each ordered point and reruns the independent gate using those observed joint answers and actual selected normals, rather than assuming bit-identical frozen-route results.

All 82 observed browser joint samples are finite and within hard intervals; separately computed FK agrees with each recorded emitter matrix to maximum component difference 4.44e−16. The actual selected surfaces differ from frozen references by at most 0.000285mm; observed solved angles differ from the fresh frozen-route runtime answers by at most 0.000138rad. Independent browser endpoint residuals remain below 0.033560mm/0.049925°. All 101 independently sampled transitions built from the actual observed endpoints retain zero door contacts, numerical-zero floor Z, bounded joints and conservative peak-speed ratio ≤1 plus 2e−16 numerical roundoff. Results are retained in `issue-07-runtime-route-browser-production-clearance.json`.

```sh
/private/tmp/kakue-door-cad-venv/bin/python scripts/verify-runtime-route-clearance.py --browser docs/verification/issue-07-browser-route-production.json
```
