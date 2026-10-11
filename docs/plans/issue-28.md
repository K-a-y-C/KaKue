# Issue #28 — Professional CAD workspace

Approved by the presenter on 2026-10-11. Tracker: https://github.com/K-a-y-C/KaKue/issues/28. Base: main d112479, including the merged PR #27 workspace/scan-result delivery. Issue #21 is closed; its motion, cancellation and stand-off contracts remain intact.

## Technical scope

Keep the locked React 19.3, TypeScript 5.9, Vite 8.3 and Three.js 0.186 stack. Use ordinary CSS and small typed React presentation components, without adding packages. Keep App's session logic and imperative scene lifecycle. Retain STEP/IK workers, asset identities, camera fitting, source bytes, geometry, selection order, 50–500 mm stand-off, home return and successful ZIP export.

Build a compact desktop application shell: branded title bar, File/Edit/View/Tools/Help menus, workflow tabs, document/command bar, viewport scene tree, inspector sections and viewport status strip. Placeholder editing/modeling commands are disabled with a clear explanation; active controls remain Import CAD, Run, Stop and successful Export. Menus only show commands and dismiss on Escape/outside activation. No fake saving or model edits. Keep the existing 64 px header, 46 px document bar and 310 px inspector so canvas dimensions and validated click fixtures remain stable. Overlay chrome must leave the actual scan region usable.

## Sequential TDD

1. Write one public Playwright test: import the real door, see menu/tab/tree/command shell at both desktop sizes, preserve disabled zero-point Run, available import and unchanged viewport bounds. Run it red; implement the smallest presentation path; rerun green.
2. Add one menu behavior test: keyboard opening/Escape dismissal, disabled placeholder commands, no point/source/joint changes. Run red; implement dismissal; rerun green.
3. Reuse scan selection/Stop/export tests to validate real controls and locked settings. Refactor presentation components only while green.

## Verification and delivery

Recheck both STEP hashes before real-asset tests. Run complete development browser suite, numerical/release tests, TypeScript/build and static release verification. Run shell, actual scan/Stop/import/export and desktop layout checks against production preview. Capture 1280×800 and 1440×900 screenshots and inspect them. Preserve historical evidence, record new outcomes/limitations in issue-28 verification and handoff, update README. Commit only this slice to codex/professional-cad-workspace, push review branch, open PR against main and attach it to this chat. User reviews/merges manually. Existing unrelated shared-checkout changes remain outside this branch.
