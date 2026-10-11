# Issue #30 technical implementation plan

Approved by the user's 2026-10-11 instruction to implement the attached redesign and open a PR. Baseline: main 5d0f941; #28/PR #29 and existing scan/export/home workflow inspected. This is one presentation vertical slice.

Framework: retain React 19.3.0, TypeScript 5.9.3, Vite 8.3.2, direct Three.js 0.186.1 and Playwright 1.63.0, existing lockfile, local workers/WASM. Ordinary CSS and local SVGs; no new dependencies, backend or desktop wrapper.

Chrome owns ribbon/tab/menu/tree/preview state through a small interface. App remains owner of source, selected points, stand-off and run lifecycle. Preview callbacks only publish a three-second status message. Real callbacks reuse existing Import, Run and Stop; DownloadControls retains the snapshot/ZIP implementation and renders its real command in the ribbon. The stand-off dialog holds only an uncommitted draft; Apply updates App's single committed value. Panes scroll independently, canvas resizes through its existing ResizeObserver. Camera pose/model transforms remain unchanged; only background/grid presentation changes.

Sequential TDD behaviors:
1. Actual STEP import reveals the default Scan ribbon and removes the header Simulation badge.
2. Selectable tabs/menus expose every specified preview command; activation and Escape preserve points/joints/source/settings/downloads and restore status after three seconds.
3. Empty desktop shell requests no CAD/workers before import and disables real scan tools; retry remains usable.
4. Stand-off editor applies valid 50–500 mm, cancels drafts and obeys run locks.
5. Docked searchable/collapsible tree, Properties/Scan data and document strip fit 1280×800/1440×900. Update browser hit fixtures by projecting the original camera-space locations into resized canvas bounds.
6. Reuse actual-asset selection, preflight, scan, Stop, return-home and independently parsed ZIP tests. Capture empty/imported/running/completed screens at both sizes and inspect against the reference.

Each behavior: one failing public test, minimal implementation, green refactor before next test. Final gates: typecheck/build, numerical/release checks, development and static-preview browser regressions, source hashes, verification/handoff/README, local commit and review PR. No new Safari/hardware-performance acceptance claim.
