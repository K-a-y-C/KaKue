# Issue #1 — supplied door verification and preparation

Issue: https://github.com/K-a-y-C/KaKue/issues/1. No blockers. Scope and implementation execution are approved by the user; this plan precedes code.

## Technical approach

Use a Node 24 command-line asset tool and Node's built-in public integration-test runner. Pin `occt-import-js` 0.0.23 in an isolated `tools/assets` package/lockfile. Derive indexed meter-space meshes and a deterministic GLB startup cache directly from the exact replacement STEP, using absolute 0.001 m linear deflection and 0.25 rad angular deflection. Retain original STEP separately and unchanged; record source/cache/settings hashes and provenance in `assets/door/manifest.json`. No application scaffold, React UI, placement search, robot changes or legacy door inputs enter this slice.

Independently reopen the supplied file using native OpenCascade Python bindings (separate parser implementation/toolchain from the browser importer), inspect real trimmed topology/bounds, and probe the window opening versus actual skin. Retain a rendered mesh view and measured report. Compare cache bounds and representative surface samples to the independent BREP within the PRD's 5 mm acceptance tolerance. These samples establish a measured subset, not exhaustive metrology.

## Public behaviors in priority order

1. `validate-door` refuses missing or changed source bytes with a readable failure; only the supplied source identity is accepted.
2. `prepare-door` produces a loadable, meter-space startup cache and provenance manifest without modifying source bytes. An independent cache reader confirms dimensions/mesh presence and reproducibility.
3. Geometry verification confirms actual door shape, window opening and source units against the independent CAD reader; preparation cannot silently accept malformed/no-mesh geometry.

Implement exactly one failing public behavior test, make it green minimally, then repeat; record red/green commands. Refactor only while green. Inspect output files through independent readers rather than testing private helpers.

## Acceptance and handoff

Record exact hashes, byte counts, parser/settings, native reader version, actual BREP and cache bounds, topology, empty-window/skin probes, sampled distances, commands and preview in `docs/verification/issue-01.md`. Update README with working preparation/validation commands and `docs/handoffs/issue-01.md` for #3. Commit passing changes locally on `issue/1-door-assets`; the orchestrator publishes the branch and PR. Door placement/reach and production browser workflow belong to subsequent issues and must remain explicitly unclaimed here.
