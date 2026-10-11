# Issue #28 — Professional CAD workspace handoff

## Delivered interface

Scan Studio retains its import-first welcome and opens the existing scene in a compact desktop CAD shell. File/Edit/View/Tools/Help reveal placeholder command panels. Model/Analysis tabs are disabled; Scan planning is active. The scene tree identifies imported part, robot assembly, scanner, platform and the live selected-point count. Run/Stop now share the top command bar with Import CAD. Scanner settings, properties, progress, point rows and successful ZIP Export stay in the inspector. A viewport strip reflects selection/run/terminal mode and units.

Placeholder actions cannot save/edit models or alter a run. Native disabled buttons, accessible tab/region labels, focus outlines, Escape dismissal/focus restoration and outside-click dismissal make their status clear.

## Contracts and implementation

`src/workspace/Chrome.tsx` owns icons and presentation-only menus/tabs/tree. React/TypeScript/Vite/Three.js and the lockfile stay unchanged. App's import/run/Stop callbacks, state machine, source bytes, stand-off validation, points and download snapshots are unchanged. No worker, robot definition, scene, picking, solver, motion or export implementation changes. Canvas sizing/camera framing stay at their previous values.

The [plan](../plans/issue-28.md) records the approved scope; [verification](../verification/issue-28.md) records sequential public-test red/green evidence and final checks/screenshots. README and both PRD variants include the interface amendment. Review branch: `codex/professional-cad-workspace`; merge remains a manual user step. No follow-on modeling implementation is implied by placeholder commands.
