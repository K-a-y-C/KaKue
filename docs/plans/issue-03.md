# Issue #3 technical plan — fixed actual demo scene

Baseline: manually accepted `origin/main` 00e08f7; live blockers #1/#2 closed with completed handoffs. Exact source SHA-256 identities were recomputed before asset-dependent work and match the guide. Read the full PRD, implementation guide, live issue and blockers, backlog, robot research and both asset handoffs/verification records.

## Stack and scope

Introduce a static React/TypeScript/Vite application using direct Three.js, ordinary CSS and Playwright browser acceptance. Pin available compatible package versions with archive integrity in a root lockfile and require Node 24 LTS. Research-baseline pins are verified against package availability before installation; record any change in verification. No runtime STEP parser/worker or IK enters this slice: issues #4/#6 own them.

React owns loading/error/ready UI and a viewport lifecycle. A small imperative scene interface owns actual GLB loading, GPU cleanup, fixed scene transforms and OrbitControls. Consume existing immutable RobotDefinition and Float64 FK without duplicating the robot chain. Use all seven supplied-CAD link GLBs, the actual replacement door GLB, rigid scanner dimensions/mount and shared floor at Z=0. A reproducible static asset preparation script verifies hashes and copies only required runtime cache/manifests into versioned same-origin public URLs for both development and production.

Independent setup tooling freezes `assets/demo/manifest.json`: a rigid column-major meter-space partToBase matrix, validated homeAngles, references to accepted source/cache identities and representative five-point evidence. Dedicated geometry agent owns this manifest, tools/scene-setup and geometry verification. App consumes the fixed transform/home. Door coordinates retain physical dimensions; actual surface minZ sets floor placement. Initial camera frames the complete actual scene; orbit, right-drag pan and wheel zoom affect only the camera.

No selection, imports, motion/run controls, laser visits, exports, persistence or speculative abstractions are implemented. The visible UI explains this scene inspection slice without offering unavailable controls.

## Incremental TDD sequence

Use the tdd skill's public behavior approach. The user's explicit plan-and-implement authorization satisfies its plan approval step; proceed without an extra approval pause. Write only one new failing browser behavior at a time:

1. Tracer bullet: opening the app loads actual prepared door, seven robot links and rigid scanner on a shared floor; readable ready state and rendered viewport. Observe RED before implementation, then GREEN with actual GLB loading.
2. Camera inspection: orbit/pan/zoom visibly alter the image while fixed robot/door measurements remain stable. Add the failing browser behavior, then minimal inspection/verification path.
3. Missing required runtime asset: actual network failure gives a readable asset-specific alert and never claims ready. Add failure injection only at network boundary.
4. WebGL2 unavailable: browser canvas context failure produces readable requirements guidance, without an unhandled exception or false ready state.

Run each green increment before the next behavior. Refactor while green. Repeat the same acceptance tests against development and built static preview; collect screenshots and request/error evidence. Supplement browser evidence with setup tooling's independent placement/route/clearance measurements rather than inferring reach from a screenshot.

## Verification and delivery

Run TypeScript, production build, all browser behaviors on development and static preview, existing door/robot public regressions and setup gates. Inspect initial framing at 1280×800 and 1440×900. Record package pins, source/cache hashes, build transfer sizes, browser/load results, red→green evidence and qualified limitations in docs/verification/issue-03.md. Update README with npm ci/dev/build/preview/test commands; add concise issue handoff.

Preserve open-shell/invalid-trimming/tiny-omitted-face qualifications and manufacturer provenance. Setup reach and sampled visual clearance are evidence for this fixed placement, not runtime IK, collision planning, physical safety or final project acceptance. Root performs review, local commits, review-branch push and PR creation; manual merge remains the user's step. Dependent issues #4/#5 start only after that merge.
