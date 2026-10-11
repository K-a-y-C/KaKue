# Scan Studio — Desktop CAD ribbon redesign

Status: implemented for issue #30; see desktop-cad-ribbon-implementation.md and ../verification/desktop-cad-ribbon.md.
Date: 2026-10-11.
Implementation baseline: GitHub main `5d0f941154c75b9fef46fbed787f397a878ae418`, currently served from `/private/tmp/kakue-github-latest-20261011`.
Reference: `/Users/kayc/Desktop/Screenshot 2026-10-11 at 7.47.20 PM.png` supplied by the user.

## Intended result

Scan Studio should look like an established desktop CAD/simulation application: a compact title strip, workflow tabs, a substantial grouped command ribbon, docked project and property panes, document tabs, a large central 3D view, and a thin status bar. Use the screenshot’s dark charcoal surfaces, small type, restrained blue selection, monochrome icons, and tight alignment throughout. Treat the viewport as a document inside an application window.

The target is the technical application inside the screenshot. Its browser tabs, address bar, macOS menu bar, Dock, webpage margins, white arrows, industrial models, pressure maps, and four-view results are reference context, not interface requirements. Retain KaKue branding, the actual supplied robot and door, and one working viewport. Do not introduce another company's branding or unrelated simulation data.

This plan changes presentation. Treating the product as a desktop application means adopting desktop visual and interaction conventions. Packaging an executable, adding native menus/window management, or changing the existing local runtime is outside this visual slice.

## 1. Remove the specified header element

The XPath `//*[@id="root"]/main/header/div/span` identifies the direct `span.environment` child of `.title-bar` in `src/App.tsx`:

```tsx
<span className="environment"><i/> Simulation</span>
```

Remove that element and its unused `.environment` styles. Do not replace it with another badge. Keep a compact, plain `Simulation` indication in the bottom status bar so the existing simulation boundary remains understandable.

Reduce branding to a small KaKue mark and `Scan Studio` in a 28 px title strip. Remove the large brand divider and welcome-page-style tagline. Show the active filename after the application name when a model is open. Add a small quick-access row for New, Open, Save, Undo and Redo; these additional project commands are dummy tools.

Do not add imitation macOS traffic lights or functional-looking minimize/maximize/close controls to the local webpage. A future native wrapper can provide actual window controls.

## 2. Replace the document toolbar with a desktop ribbon

Remove the current 46 px `.document-toolbar` arrangement, which mixes filename, three workflow tabs, Run/Stop, and Import CAD in one row. Replace it with two separate regions:

- A 30 px tab strip: `File`, `Geometry`, `Robot`, `Scan`, `View`, `Results`, `Tools`, `Help`.
- A 104 px ribbon beneath it, including a 20 px group caption band. `Scan` is selected initially.

Tabs must be selectable and switch the displayed tool groups even when their tools are dummy. Use square tabs, a slightly lighter active fill, and a 2 px blue top edge. File and Help open compact application menus. Move the existing File/Edit/View/Tools/Help navigation into this structure; avoid two competing menu systems.

Ribbon groups sit next to each other in subtly lighter rectangular blocks, separated by 1 px vertical lines and 4 px gaps. Give each group a small centered caption at its bottom. Use large commands with an icon above a two-line label, and secondary commands as stacked small icon-and-label rows. This grouped ribbon is the most important change needed to resemble the reference.

### Default Scan ribbon — exact command arrangement

| Group | Commands and icon forms | Size and behavior |
| --- | --- | --- |
| CAD | Import CAD: document with inward arrow; Model properties: cube with information mark | Import is a large real command. Properties is a small command that opens/focuses the existing properties pane. |
| Selection | Select surface point: pointer with crosshair; Select face: shaded face; Select region: dashed rectangle; Clear selection: crossed points | Surface selection is a large command reflecting the existing append-only selection mode. The other three are dummy commands; Clear must not delete points. |
| Scanner | Set stand-off: scanner above a surface with dimension arrows; Scanner orientation: scanner with curved arrow; Laser preview: fan/rays | Set stand-off is a large real command opening a compact distance editor. The other two are dummy commands. |
| Sequence | Run: filled triangle; Stop: filled square; Route options: numbered path; Validate route: path with check | Run and Stop are large real commands with existing availability rules. Options and standalone validation are dummy commands. Run still performs actual preflight. |
| Output | Export: document/archive with outward arrow; Point cloud: dotted cube; Coordinates: table grid; Report: document with chart | Export uses the existing successful-scan ZIP action. Remaining commands are dummy. |

Label the distance command **Set stand-off**, rather than “set stand off point”: stand-off is a scanner distance, while a surface point is a separate selected location. Its editor shows `Stand-off`, a compact numeric spinbox, `mm`, and Apply/Cancel. Preserve the 100 mm default, inclusive 50–500 mm range, and preparation/run locks. Apply changes the existing value; Cancel discards edits. Do not duplicate editable distance state between the ribbon and properties pane.

Selection mode is already active in the current application. Its command can focus the viewport and show the existing active state; it must not introduce an unplanned editing mode or change selection order.

### Additional tabs — exact dummy commands

| Tab | Groups and commands |
| --- | --- |
| Geometry | Create: Box, Cylinder, Plane. Modify: Move, Rotate, Scale. Inspect: Measure, Section, Interference. |
| Robot | Setup: Select robot, Tool mount, Joint limits. Position: Jog, Home, Teach pose. |
| View | Navigate: Orbit, Pan, Zoom, Fit. Orientation: Front, Top, Right, Isometric. Display: Shaded, Wireframe, Grid, Axes. |
| Results | Data: Point cloud, Coordinates, Scan report. Compare: Compare scans, Statistics. |
| Tools | Automation: Script editor, Run script, Record macro. Workspace: Preferences, Layout, Plugins. |
| File menu | New project, Open project, Save project, Save as, Recent projects. Include the real Import CAD command. |
| Help menu | Help contents, Keyboard shortcuts, About. |

These added commands do not move/scale models, reset the robot, change the camera, generate reports, save projects, run scripts, or call services. Existing viewport gestures continue to provide real orbit/pan/zoom. Do not imply a new robot choice or CAD editing capability merely because its command is visible.

At 1280 px width, all default Scan groups must fit without a second ribbon row or horizontal page scrolling. Use fewer stacked small commands per group, keep captions brief, and collapse secondary command labels into a compact group dropdown only if necessary. Retain the major Import, Select surface point, Set stand-off, Run, Stop and Export labels.

## 3. Make added tools clickable dummies

Interpret “make them all dummy” as applying to the additional desktop command vocabulary. Keep the existing Import, point picking, stand-off, Run, Stop, home return, and Export working. This is the proposed scope distinction; if the intended deliverable is an entirely nonfunctional visual mockup, implement it as a separate preview rather than silently disabling the scan application.

Dummy tools must look like normal enabled ribbon buttons and respond to click, keyboard activation, hover, and pressed feedback. On activation, show a short status-bar message such as `Measure — preview command`; then return to the previous status after three seconds. Tooltips append `Preview command`. Do not show dialogs, success toasts, fake output, or change the source, points, joints, camera, workers, or downloads. Avoid disabled styling for every dummy command: a whole disabled ribbon would fail the requested visual impression.

Keep real commands genuinely disabled when their prerequisites are absent or the session is locked. Use muted icons and text without a blue hover highlight. Tabs and harmless dummy commands can remain navigable during scanning. No dummy command may bypass a real control's lock.

## 4. Dock the project tree and property pane

Remove the floating `.scene-tree` card from inside the viewport. Place a 220 px docked left pane with a thin border, small header tabs `Project outline` / `Model`, and a compact search/filter strip. Search filters the visible tree labels only; it does not filter geometry.

Tree hierarchy:

```text
Inspection cell
  Imported part — <actual filename>
  Robot assembly
    Base
    Link 1 … Link 6
  Scanner
  Base platform
  Surface points (<actual count>)
    Point 1 … Point N
```

Use small disclosure triangles, 16 px object icons, 24 px rows, 12 px indentation per level, muted visibility glyphs, and one blue selected row. Expanding/collapsing branches and selecting rows are shell interactions only. Visibility glyphs are dummy commands; do not hide source geometry. Keep source and point counts truthful.

Use a 270 px docked right pane with `Properties` / `Scan data` tabs, 28 px title bars, collapsible section headers, and compact label/value rows. Replace the current generous inspector padding, pale blue status card, dashed empty-state card, and oversized full-width input. Properties contains Part, Scanner, and Sequence sections. Scan data contains the existing selected-points table, actual statuses, and progress. Units are explicit and numeric columns use tabular digits. Empty tables show one muted `No surface points selected` row rather than an onboarding illustration.

## 5. Frame the viewport as a document

Above the central canvas, add a 26 px document strip with an active tab `DOOR-of-CAR.step — 3D view` using the real imported filename. Add a dummy plus/new-view command. Do not add a working close button without an approved source/session reset behavior.

Keep one central canvas. Add a compact top-right view toolbar with monochrome Perspective, Fit, Orbit, Pan, Grid, and Axes icons; these toolbar additions are dummy commands with tooltips. Move gesture guidance into the bottom status bar and remove the floating rounded instruction pill.

Use a neutral dark-gray viewport background, subdued grid, and readable point-marker contrast. Preserve the actual geometry, physical dimensions, placements, scanner mount, joints, picking, red projection, and camera controls. Make background/grid color adjustments through existing scene presentation settings only; no replacement mesh, simulation effect, or scientific color map is needed.

The existing camera aspect ratio and clickable surface fixtures will change when panes are docked. Keep camera pose and model transforms stable, resize the renderer to the new canvas, and update viewport-relative browser click fixtures from real projected surface locations. Do not keep obsolete full-window click coordinates or move the model to compensate for reduced viewport space.

## 6. Exact visual tokens and sizing

| Item | Proposed value |
| --- | --- |
| Typeface | System UI: Segoe UI on Windows, system sans on macOS; no downloaded font |
| Body/tool labels | 11 px; pane headings 12 px; group captions 10 px |
| Title/menu surface | `#1b1b1b` |
| Ribbon/pane surface | `#2d2d2d` |
| Ribbon group surface | `#373737` |
| Fields/tree background | `#252525` |
| Viewport background | `#3a3a3a` |
| Separators | `#484848`, 1 px |
| Primary text | `#dedede` |
| Secondary text | `#a7a7a7` |
| Inactive real commands | `#707070` |
| Active/focus accent | `#168bd2`; selected tree fill `#254b62` |
| Hover / pressed | `#464646` / `#505050` |
| Corners | 0–2 px; no pill buttons or rounded cards |
| Icons | Local SVG, 16 px small / 24 px large; consistent 1.5 px strokes with selective filled forms |
| Large ribbon command | Approximately 64–76 px wide × 64 px high |
| Small command row | 24 px high |
| Numeric fields | 24 px high; square inset border; native spin controls |
| Status bar | 24 px high, full application width |

No gradients, elevated card shadows, oversized headings, wide empty margins, decorative badges, or bold full-width call-to-action buttons. Reserve green/red for recognizable Run/Stop icon accents and actual status meaning. Use blue primarily for active tabs, selection, and focus.

At 1440×900, the 28 px title + 30 px tabs + 104 px ribbon + 24 px status leave 714 px for the document workspace, including the 26 px document strip. With 220/270 px side panes and two 1 px separators, the center is approximately 948 px wide. At 1280×800, it is approximately 788 px wide and the document workspace is 614 px high. The canvas must resize inside this region. Pane contents scroll independently; the application window never becomes a scrolling webpage.

## 7. Replace the welcome landing page with an empty desktop workspace

Before import, show the same title, tabs, ribbon, empty docked panes, blank document area, and status bar. The actual scene, CAD requests, and parser workers still wait for a valid import.

Replace `Create a scan workspace`, the large white import card, numbered marketing steps, and browser/privacy footnote with a small centered application prompt: `No model open` and `Import CAD to begin`. Import CAD in the ribbon is the primary entry. Real scan commands are disabled. Loading/errors appear in compact application status/progress UI and readable inline error text; preserve retry behavior and screen-reader announcements. Reload returns to this empty application workspace.

## 8. Implementation boundaries and acceptance

Modify presentation in `src/App.tsx`, `src/workspace/Chrome.tsx`, and `src/style.css`; add small Ribbon, CommandButton, DockPanel, and icon components as needed. Use the current React/TypeScript/Vite/Three.js stack and local SVGs. No additional UI framework or icon-service dependency is necessary. The export action continues to use `src/export/DownloadControls.tsx`. Limit scene changes to viewport colors/resize integration.

Implement this as one visual vertical slice with sequential public behavior tests: one failing visible behavior → minimal passing change → repeat → refactor while green. First prove the removed badge and default ribbon on an imported real model. Next prove selectable tabs/dummy-command feedback without changing session data. Then prove the empty desktop workspace and actual control availability. Reuse current real import, selection, scan, Stop, home-return, and ZIP tests.

Acceptance checklist:

- The XPath-targeted Simulation badge is absent; simulation remains clearly identified in the status bar.
- The first impression matches the reference's dark, dense desktop application chrome at both 1280×800 and 1440×900.
- The default ribbon contains recognizable labeled icons, group captions, and a working Set stand-off editor.
- Every listed additional command is visible through its tab/menu and safely clickable as a dummy.
- Docked panes, document tab, compact property rows, and a full-width status bar replace floating cards and web-style onboarding.
- Actual imported geometry and scan behavior remain correct; dummy tools cannot mutate the session.
- No clipped major commands, horizontal page scroll, hidden Stop, or illegible coordinate/status text.
- Tooltips, accessible names, keyboard focus, Escape dismissal, and real disabled states work.
- Exact supplied CAD hashes are rechecked before actual-asset verification; build and static production workflow pass.
- Capture and inspect both desktop sizes in empty, imported, running, and completed states; compare the chrome against the supplied screenshot.

The user approved implementing this visual specification. The technical plan, verification and handoff record the delivered scope; added CAD commands remain previews.
