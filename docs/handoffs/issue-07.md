# Issue 7 handoff

Complete immutable ordered-route preparation and scanner playback are delivered. Run accepts one or more selected points; all target poses must pass local-worker full preflight before any motion. Earlier valid rows in a blocked route show Not visited while problem rows retain diagnostics. During playback, Current point and Visited count advance in selection order. Rows become Visited only after the one-second endpoint dwell; the final pose remains and laser extinguishes.

Existing `RunPlan`/`PlannedPoint` contracts are reused unchanged. App preserves preceding joints for each `visit` transition and immutable source selection. Preflight already seeds each target from the preceding verified pose and selects a validated least-displacement candidate. Actual frozen five surface locations originate browser mouse clicks on the supplied cached door. Independent runtime numerical/actual geometry evidence reconciles the alternate wrist branch chosen at runtime with prior setup clearance; manifest joint answers are never passed to solving.

Issue #8 is next: promote explicit cancelled/stopped status and terminal snapshots using the existing run token, AbortController, worker cancel and `visit` cancellation seams. Keep current joints frozen, laser off, visited rows intact, moving→stopped and ready→not_visited, including preparation cancellation. Issue #9 owns terminal downloads. No Stop/download controls are introduced in #7.

See README and issue #7 verification for reproducible commands and gate results. Browser scope was amended by user to Chrome only; final presenter-hardware/FPS acceptance remains #10. Finite geometry samples do not establish continuous collision checking or physical safety.
