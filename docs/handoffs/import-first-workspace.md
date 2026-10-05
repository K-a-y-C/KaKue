# Branded import-first workspace handoff

User amendment stacked on the rectangular laser PR #25 (after #9 PR #23 and #10 PR #24). [Plan](../plans/import-first-workspace.md), [verification](../verification/import-first-workspace.md).

Start at a KaKue-branded import screen. No default CAD, robot, canvas, scan controls or CAD/parser requests before selection. First eligible import validates and either uses the exact supplied-door hash-matched cache or parses actual selected STEP geometry. Original File/name remains the export source. Successful initialization reveals the application header/document toolbar and scan inspector. Invalid first imports stay on the welcome screen; reload returns there. Later imports still clear selections/results and restore the accepted home. Import remains locked during preparing/running.

The scene now receives an InitialPart explicitly; automatic bundled-source fetching is removed from startup. The previous loadBundledSource helper remains for independently verifying the distributed original source. Permanent app cleanup cancels pending initial parsing even before a scene exists; each scene owns/disposes its resources. Latest source ownership and valid later replacement readiness remain separate checks.

The unchanged user-provided Logo.jpeg is copied to src/assets/logo.jpeg and emitted locally by Vite; provenance/hash is recorded. No dependency, robot/door source, mount, motion/math or download format changes. Full public behavior coverage explicitly imports supplied CAD through tests/browser/fixtures.ts, while startup tests use the unmodified browser fixture to check the empty first screen.

Reproduce with Node 24: npm ci; npm run build; npm run verify:release; PREVIEW=1 npm test. Hardware: PREVIEW=1 PRESENTER=1 EVIDENCE_PREFIX=workspace npx playwright test tests/browser/delivery.spec.ts -g hardware. Follow the static HTTPS/MIME/BASE_PATH instructions from #10. Review/merge manually after the preceding PRs.

Final validation: production 64 passed/19 intentional skips; final startup 4; hardware 3 (59.86/59.95 FPS); numerical 9; release CLI 4; build/typecheck/release inventory and diff checks passed. Standards and Spec reviews found no actionable issues. Local screenshots and exact-source/export reports are linked from verification.
