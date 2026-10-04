# Issue 2 — verified CAD robot and scanner

Approved scope: GitHub #2, no blockers. The user authorized implementation with a dedicated issue agent and local branch commits. This slice prepares assets and a demonstrable articulated preview; issue 3 introduces the React/TypeScript/Vite application.

## Technical decisions

- A typed immutable RobotDefinition is compiled from the pinned joint description and the PRD, with meters/radians, column-major Float64 rigid matrices, signed revolute axes, hard intervals, 10% rated demo speeds, and the home vector `(0,-π/2,π/2,0,0,0)`.
- Pinned `occt-import-js@0.0.23` tessellates the exact supplied STEP in millimeters, absolute 1 mm linear deflection, angular 0.25 radians. Verify source hash before selecting the approved importer groups `[73],[8],[6,7],[0,1,2],[5],[4],[3]`.
- Apply inverse home transforms and convert millimeters to meters once. Write seven rigid GLBs preserving source materials, normals, topology and geometric dimensions. No DAE replacement or scaling to fit.
- Direct Three.js in an isolated preparation preview displays actual articulated links, the rigid scanner box, joint datums and a translucent original-core overlay. Runtime rendering and FK read the same immutable definition. Preparation tooling remains separate from the future application scaffold.
- Retain source/dependency provenance, all derived hashes, units, excluded fixture/dress meshes and export overlay residuals. No runtime ROS parser or IK is introduced.

## TDD sequence

1. First failing public pose test: home flange/emitter and pivots match direct independent STEP measurements. Implement the minimal definition and FK until green.
2. Add a failing signed-motion/frame/interval behavior check, then implement validation and verify another analytically independent pose plus scanner orientation. Audit every compiled origin, axis, bound and speed against pinned xacro/manufacturer evidence.
3. Add failing actual-asset preparation check, prepare GLBs, independently read exported buffers and reassemble onto source vertices at home. Record maximum residual, common-unit bounds and hashes.
4. Exercise the articulated home preview and source overlay, retain screenshots and verify changed pose uses real pivots and rigid mount. Refactor only while green.

## Acceptance and handoff

Run public numeric tests, actual STEP regeneration and independent exported-buffer checks. Record commands and red/green results in issue verification; update README and handoff. No full-demo acceptance claim: door placement, runtime solver, production workflow and target-browser acceptance belong to later issues. Commit only this issue's changes on `issue/2-robot-assets`; the orchestrator publishes the PR.
