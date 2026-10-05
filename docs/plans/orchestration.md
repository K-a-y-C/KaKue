# Issue execution and review

Approved by the user on 2026-10-05: resume from issue #6 with one dedicated live agent per issue. Write its technical plan before implementation, perform one public behavior red/green cycle at a time, verify its acceptance gates, commit locally, publish an issue branch, open a PR, review it, and merge when mandatory slice checks pass. Then proceed to the next unblocked issue. This supersedes the earlier manual-review-only instruction. Keep main changes behind reviewed PRs; do not bypass acceptance gates. Focused supporting subagents are authorized when useful.

The application stack is React, TypeScript, Vite, direct Three.js, local STEP/IK workers, and same-origin parser/WASM. Asset prerequisites use reproducible command-line preparation and independent CAD checks. Application scaffolding begins with issue #3, not in a speculative separate layer.

Source intake precedes implementation. Issues #1 and #2 are independently ready and may have separate agents. Issue #3 depends on both; #4 and #5 depend on #3; #6 → #7 → #8 follows motion; #9 depends on #4 and #8; #10 is the final actual-asset production gate. Inspect verified deliverables as well as issue state before starting a dependent slice. Pending PRs must not be described as landed or accepted.

Each issue records its plan in docs/plans, commands and results in docs/verification, and its next-step handoff in docs/handoffs. Do not close issues or claim final acceptance with unverified mandatory gates. Browser/hardware checks must describe the browser and machine actually used.

Browser acceptance update (2026-10-05): the user explicitly requested Chrome only and waived Safari/Edge checks. Final production acceptance uses installed Chrome on this Mac, including real hardware performance measurement; software-rendered regression tests do not establish the FPS gate.
