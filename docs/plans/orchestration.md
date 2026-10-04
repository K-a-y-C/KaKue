# Issue execution and review

Approved by the user on 2026-10-04: use one dedicated agent per issue, write its technical plan before implementation, perform one public behavior red/green cycle at a time, verify its acceptance gates, commit locally, publish an issue branch, and open a PR for manual review. Never push to main or merge PRs.

The application stack is React, TypeScript, Vite, direct Three.js, local STEP/IK workers, and same-origin parser/WASM. Asset prerequisites use reproducible command-line preparation and independent CAD checks. Application scaffolding begins with issue #3, not in a speculative separate layer.

Source intake precedes implementation. Issues #1 and #2 are independently ready and may have separate agents. Issue #3 depends on both; #4 and #5 depend on #3; #6 → #7 → #8 follows motion; #9 depends on #4 and #8; #10 is the final actual-asset production gate. Inspect verified deliverables as well as issue state before starting a dependent slice. Pending PRs must not be described as landed or accepted.

Each issue records its plan in docs/plans, commands and results in docs/verification, and its next-step handoff in docs/handoffs. Do not close issues or claim final acceptance with unverified mandatory gates. Browser/hardware checks must describe the browser and machine actually used.
