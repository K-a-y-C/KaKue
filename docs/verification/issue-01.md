# Issue #1 — supplied replacement door verification

Issue: https://github.com/K-a-y-C/KaKue/issues/1. Asset slice implemented and independently measured; review/manual merge remains pending. No application, placement, reach or production-browser acceptance is claimed.

## Exact source and derived cache

Only `3d files/car-front-door-1/DOOR-of-CAR.step` was used. The complete original bytes are tracked, not rewritten, converted or repaired. No older door, JPG-derived geometry or CATPart conversion enters the cache.

- Original: 14,456,880 bytes; SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`.
- Source header: AP214 `AUTOMOTIVE_DESIGN`; entity #6 is `LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.)`. Original export header is dated 2016-01-29; provenance is the user's replacement supplied 2026-10-04, not an invented conversion history.
- Cache: `assets/door/door.glb`, 4,260,444 bytes; SHA-256 `4059bd8e252b8ada125adbcdb1232c4bf26ec5bdd4d8689d8a21ac572e0f9b43`.
- Importer: pinned `occt-import-js` 0.0.23; meter output, absolute linear deflection 0.001 m, angular deflection 0.25 radians. No decimation or aesthetic scaling.
- Cache: nine indexed meshes, 137,639 triangles, Float32 positions/normals and Uint32 indices. Encoded accessor bounds equal the serialized Float32 extrema. Material is double-sided because these are open surface shells.
- Repeated public preparation produces identical GLB bytes; the integration test compares the generated hash to the checked-in cache. It also verifies that input bytes remain unchanged and independently decodes coordinates/normals.

## Independent CAD reader and actual dimensions

Native `cadquery-ocp` 7.8.1.1 / OpenCascade bindings, Python 3.12.14 and VTK 9.3.1 reopened and transferred the source independently of `occt-import-js`. Both toolchains use OpenCascade; this is a separate native reader/version, not a claim of an unrelated geometry kernel. Native actual face triangulation contains 142,334 triangles and uses 1 mm absolute / 0.25 rad meshing settings. The retained [measurement report](door-native-report.json) is generated without invoking the browser importer. The [preview](door-native-preview.png) renders those native triangles, not the supplied JPGs.

| Bounds in original source millimeters | Minimum XYZ | Maximum XYZ |
| --- | --- | --- |
| Full source including wires | (1428.991730, -861.721950, 76.152560) | (2641.599401, -479.612643, 1483.357268) |
| Actual native triangulated surfaces | (1429.145481, -858.245939, 367.240297) | (2641.599340, -479.661415, 1483.356668) |
| GLB surface coordinates decoded independently | (1429.145455, -858.301580, 367.240310) | (2641.599417, -479.661405, 1483.356714) |

Native surface dimensions are approximately **1212.454 × 378.585 × 1116.116 mm** in X/Y/Z. Maximum native/cache bound difference is **0.055641 mm**. Lowest selectable door surface is Z=367.240297 mm in the unchanged source frame. Issue #3 must use surface bounds when placing the door on the floor.

The apparent 291 mm discrepancy in full-source minimum Z is a standalone construction edge (#0 in the native explorer), at X=1440.857608, Y=-803.072836 and Z=76.152560…545.269260 mm. Triangle preparation omits wire/line geometry explicitly; original STEP still includes it. Full-source BREP bounds must not be mistaken for visible skin bounds.

## Shape, window and measured accuracy

The independently rendered native source is a recognizable front door with lower skins, upper frame and empty main window. Both actual trimmed BREP intersections and independently decoded GLB triangle intersections agree:

- Window ray: origin (2100,-2000,1200) mm, direction +Y: **zero hits**, so there is no glass/selectable surface there.
- Skin ray: origin (2100,-2000,750) mm, direction +Y: two surface hits; largest cache/native hit error approximately **0.287151 mm**.
- Upper-frame ray: origin (2400,-2000,1470) mm, direction +Y: three surface hits; largest cache/native hit error approximately **0.114210 mm**.

Forty deterministic broadly distributed triangle-center samples in each direction use exact closest-point distances over **every triangle**, including plane, edge and vertex regions. No nearest-centroid-only estimate is used:

- Cache → independent native triangles: maximum **0.101981 mm**.
- Native triangles → cache: maximum **0.108890 mm**.
- Those native triangle centers → their independently retained analytic trimmed BREP faces: maximum **0.143614 mm**.
- All cache normals are finite; maximum unit-length error is approximately **4.94e-8**.

These finite samples and independent known rays pass the 5 mm demo threshold. They are not exhaustive Hausdorff proof, exact analytic picking normals, or metrology. Browser surface picking still requires its own later gate.

## Source topology and omitted tiny faces

The source is **nine shells, 3064 faces, zero solids**. `BRepCheck_Analyzer` returns false. Faces #601 and #2918 have `UnorientableShape` status and self-intersecting trimming wires; neither source nor cache is described as a repaired/closed solid. Face #2918 (3851.496 mm²) is triangulated by both readers.

The browser importer reports empty triangle ranges for two tiny faces:

| Native face ordinal | Area | Diagnosis | Independent trimmed-surface/vertex samples | Max distance to retained cache |
| --- | --- | --- | --- | --- |
| 601 | 0.055798 mm² | Invalid trimming wire; native still triangulates it | 121 | 0.098319 mm |
| 755 | 0.756753 mm² | Native BREP is valid but neither reader tessellates it at these settings | 433 | 1.737017 mm |

The original face vertices and a 21×21 UV grid are classified against the actual trim. Only inside/on points are retained. Their distance to all cache triangles is measured independently. The omitted total 0.812551 mm² is acknowledged and remains within the measured 5 mm tolerance, rather than silently inventing geometry. Ordinals are reader traversal positions tied to this exact source/toolchain, not STEP entity IDs. Full details and sample counts are retained in the report.

## TDD and reproduction

Use Node 24 LTS. Tests were executed with bundled Node **24.19.0**. Dependency installation initially used the host's Node 22 and warned about the engine; all final behavioral verification uses Node 24. The lockfile pins archive integrity for `occt-import-js` 0.0.23.

```sh
npm ci --prefix tools/assets
npm --prefix tools/assets run validate:door
npm --prefix tools/assets run prepare:door
npm --prefix tools/assets run validate:door -- --cache ../../assets/door
npm test --prefix tools/assets
```

One failing public CLI behavior preceded its minimal passing implementation each time. Red/green checks were run individually before proceeding:

1. Missing authoritative source: missing CLI module/error → explicit required STEP failure.
2. Changed source identity: falsely succeeds → rejects different bytes/hash.
3. Preparation: missing manifest/cache → produces indexed meter-space GLB; subsequent assertions verify unchanged input, native bounds, normals and repeatability.
4. Corrupt cache: falsely succeeds → rejects digest mismatch.
5. Serialized accessor bounds: double-precision extrema disagree with encoded Float32 → extrema now computed from serialized values.
6. Missing cache: blames existing STEP → identifies the actual missing cache path.
7. Cache provenance: accepts a different source claim → rejects manifest identity mismatch.
8. Cache settings: accepts unverified coarse tessellation claim → rejects parser/settings mismatch.

All eight checks pass. Independent native verification additionally fails on source/unit mismatch, parse failure, missing shape, invalid GLB, nonfinite positions/normals, wrong window/skin/frame hit behavior, bounds/sample/hit differences exceeding 5 mm. A failed initial frame probe was corrected to an actual upper-frame fixture after geometric inspection; no source geometry changed.

Native reproduction (separate from browser runtime):

```sh
python3.12 -m venv /private/tmp/kakue-door-cad-venv
/private/tmp/kakue-door-cad-venv/bin/python -m pip install -r tools/assets/requirements-verification.txt
/private/tmp/kakue-door-cad-venv/bin/python tools/assets/verify-door.py --preview-data /private/tmp/door-native-triangles.json
```

Optional native preview rendering requires Pillow 12.3.0:

```sh
python3.12 -m pip install Pillow==12.3.0
python3.12 tools/assets/render-door-preview.py /private/tmp/door-native-triangles.json
```

The tool prints progress for the small-face checks and records elapsed verification time. Original source identity, cache identity, report and preview are retained. Native tools stay in temporary storage; importer notices/source links are retained in `tools/assets/notices`.

## Gate boundary

The supplied-door asset gate has measured passing source identity, actual shape/window/unit/surface bounds and reproducible source-derived cache behavior. Topology/sampling limitations are explicit. Door placement, reachability, renderer/picking integration, browser import/download and static production workflow remain acceptance work for issues #3 onward. Do not close #1 until its PR is manually accepted; issue #3 also waits for #2's manual merge.
