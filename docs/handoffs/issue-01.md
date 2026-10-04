# Issue #1 handoff

Delivered the actual replacement STEP's source-validation/preparation CLI, pinned isolated tool package, deterministic indexed meter-space GLB, provenance manifest, native CAD measurement/report/preview and eight passing public integration checks. Exact original source bytes remain unchanged.

Read `docs/verification/issue-01.md` and `assets/door/manifest.json`. Use `npm ci --prefix tools/assets`, `npm --prefix tools/assets run prepare:door`, and `npm test --prefix tools/assets` with Node 24. Native verification instructions are in the record. Cache SHA-256 is `4059bd8e252b8ada125adbcdb1232c4bf26ec5bdd4d8689d8a21ac572e0f9b43` (4,260,444 bytes; nine meshes/137,639 triangles).

The door is approximately 1212.454 mm wide in source X and 1116.116 mm high in source Z. Use native **surface** minZ 367.240297 mm, not full source minZ 76.152560 mm: the source contains an isolated construction edge below the skin. GLB retains original part-coordinate orientation/position, normalized only from millimeters to meters. No part-to-base transform is frozen by this issue. Source skin mainly faces the Y direction; issue #3 must rotate/place it upright facing the robot in -X, preserving dimensions.

Source comprises open shells and has two invalid trimming wires. Two tiny faces omitted by browser tessellation total 0.812551 mm²; 554 independently classified UV/vertex samples remain within 1.737017 mm of retained cache triangles. Report records exact topology and bidirectional accuracy samples; do not label it closed/repaired CAD or exhaustive metrology.

When #1 and #2 are both manually merged, #3 can use actual door/robot assets for its scene-loading TDD slice. Freeze the numeric door transform only after independent representative pose/clearance checks. No dependent issue starts before user review/merges. Do not infer browser picking/download or five-point production acceptance from asset evidence. Root handles branch publication, PR creation and issue completion after manual acceptance.
