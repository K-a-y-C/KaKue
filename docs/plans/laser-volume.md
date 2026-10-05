# Rectangular 3D laser projection plan

User requirement after issues #9/#10 (PRs #23/#24; baseline d5dab23): the broad red projection must have depth and a square/rectangular end instead of terminating in a line. The attached screenshot is a visual reference only. Keep supplied geometry and pinned React/TypeScript/Vite/direct Three.js. No new dependency or backend.

## Slice and geometry

Replace the flat 240 mm triangular sheet in the existing wrist-attached laser group with an illustrative rectangular frustum. Near aperture is 80×60 mm on the scanner face; far footprint is 240×180 mm at the selected 50–500 mm axial stand-off. Four translucent side walls establish depth; a filled rectangular far face and a dense 13×9 grid of 117 rays make the end area visible. This is a conceptual visualization, not a measured beam specification or acquired surface data.

Use actual local geometry dimensions for canvas diagnostics. Keep the existing setLaser(enabled, distance) interface and rigid wrist/emitter mounting: Z scaling changes reach only, X/Y remain the specified rectangle. Rendering follows the actual joints, never an independently aimed substitute. Preserve continuous motion/dwell activation, terminal/Stop extinction, selection locking and selected-point/export contracts. No new projection points enter the PLY/CSV.

## TDD and checks

First extend one public Run acceptance check at 50 mm to require a nonzero end height and four rectangular corners; demonstrate RED against the line-shaped sheet, then minimally replace the geometry and pass. Repeat the far 500 mm check and update the superseded 61-ray expectation to the approved 117-ray grid. Capture actual dwell screenshots from multiple camera views and inspect them for visible depth/end area. Refactor green only if the scene benefits from a small cohesive geometry module.

Run production scan/Stop, selection, actual five-point independently parsed exports, release integrity and both retina hardware five-point FPS checks after the render change. Retain geometry-derived footprint/range evidence, actual scan screenshots and final performance reports separately from historical issue #21/#10 artifacts. Update README, both PRDs, guide and handoff to state the amended laser geometry. Commit locally, review Standards/Spec, push a separate branch and create a PR stacked on #10; manual review order #9 → #10 → this change.
