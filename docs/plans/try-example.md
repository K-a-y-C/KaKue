# Example start and logo removal

User-approved scope, 2026-11-13: remove the KaKue logo from the title strip and Scan ribbon; offer **Try example** when the app first opens. Clicking it loads only the supplied `DOOR-of-CAR.step` automatically. Keep local Import CAD available and continue through the existing surface selection, stand-off, Run, Stop, home return and successful ZIP Export workflow.

Base: `origin/main`, `3e1e32b`. Inspected completed blockers #3 (actual scene, #1/#2 assets), #4 (import/session ownership), #9 (exports), #30 (ribbon), and #32 (branding). Actual delivered source, cache, import/session and browser contracts were read. The new request supersedes import-only startup and visible-logo requirements; it does not reopen the final delivery/hardware acceptance gate in #10.

Use the existing `loadBundledSource` hash verification and accepted `InitialPart.cacheSource` seam. Share the import session's cancellation, generation checks, readiness and error handling. No asset replacement or new parser/scene pipeline.

Sequential TDD: logo absence at both desktop sizes, then explicit example loading through a successful scan. Follow with public recovery and replacement-race coverage. Run the development regression, numerical/release checks and production workflow before opening the PR. Record evidence in `docs/verification/try-example.md` and handoff in `docs/handoffs/try-example.md`.
