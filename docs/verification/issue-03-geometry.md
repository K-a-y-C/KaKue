# Issue 3 fixed scene geometry and setup gate

Verified 2026-10-04 using the supplied surfaces and core-link caches accepted by issues 1 and 2. This is independent **setup tooling**, not the future runtime solver or full production-route acceptance.

## Identity and frames

`tools/scene-setup/verify.py` rehashes both actual STEP inputs before setup and verifies the exact source byte counts/hashes in their accepted manifests. It also rehashes the door GLB and all seven robot GLBs before reading vertices. The same accepted assets remain unchanged. Independent chain origins/axes, hard angular bounds, source CAD home, measured home emitter and +90° local-Y / +80 mm scanner composition are checked against `RobotDefinition`; no application FK/IK implementation is imported.

Input SHA-256: door `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`; robot `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`. The prior independent native CAD reports, open-shell/invalid-wire/omitted-face qualifications, source pivot measurements and payload/controller-sign qualifications remain applicable.

All geometry stays in meters; angular values stay in radians. The fixed part transform in `assets/demo/manifest.json` is column-major and rigid: +90° about world Z, translation **(0.9203385949134826, -2.0353724360466003, -0.367240297) m**. Source X becomes base Y; source +Y becomes base −X; Z remains upright. The rotation has determinant +1 and applies no fit-to-size scaling.

Floor placement uses **native surface** minZ 367.240297mm, excluding the isolated source construction edge. Float32 cache rounding leaves its lowest rendered vertex 0.000012715mm above the floor. Visible bounds are X1400…1778.640175mm, Y−606.226981…+606.226981mm, Z≈0…1116.116417mm. The source dimensions are preserved. The decorative shared floor remains Z=0.

## Placement and validated demo home

The PRD's initial 900mm nearest-surface candidate passed pose reach but **failed actual sampled mesh clearance**: 33 robot-link contact samples in the exploratory source-home route. A 1200mm candidate reduced link contacts but the scanner still swept the upper frame and a central protrusion. These rejected candidates are not accepted reach/clearance evidence.

The final nearest-surface X1400mm placement and route avoid the central concavity. The source CAD home also caused an illustrative home-to-first-target scanner sweep through upper-frame geometry. The PRD permits a validated replacement, so the manifest freezes a retracted **demo home** rather than asserting the source CAD display pose is a sensible scan start.

Demo-home six angles in degrees, rounded only here: **(0, -85.8929588, 146.6182194, 0, -60.7252606, -90)**. Exact radians are in `homeAngles`. Independent emitter position is **(900,0,800)mm**; flange position is **(820,0,800)mm**. `homeEmitterPose` and `homeFlangePose` retain complete column-major Float64 matrices. Optical +Z faces base +X; scanner +Y faces world +Z. All six angles satisfy the same authoritative hard intervals. The source CAD display vector `(0,-90,+90,0,0,0)` stays in `RobotDefinition.home` and `sourceCadHomeAngles` for source reassembly provenance; fresh scene/import/run initialization must use the manifest's validated **demo** `homeAngles`.

Scanner dimensions/composition are unchanged: 80×60×80mm box, rear face at tool0, center +40mm optical Z, emitter +80mm optical Z. The setup solver includes this mount; emitter targets are not flange or surface coordinates.

## Actual surface route and independent pose checks

Five +X rays from the robot approach side intersect the **nearest actual indexed triangles**, with barycentric hit/normal interpolation and approach-side sign. No surrogate plane is used. Stored triangle index/barycentrics, source-local surface coordinates, base surface coordinates, normals, 100mm stand-off emitter targets, deterministic full orientation and bounded solved angles make the setup reproducible.

| Point | Base surface XYZ mm | Approach-side unit normal, rounded |
| --- | --- | --- |
|1|(1648.553932,300,550)|(−0.814743,−0.024194,+0.579317)|
|2|(1658.438598,300,400)|(−1,≈0,≈0)|
|3|(1658.438587,300,300)|(−1,0,0)|
|4|(1656.719024,−300,300)|(−0.823164,−0.041432,+0.566291)|
|5|(1645.645252,−300,550)|(−0.906707,+0.178445,−0.382150)|

The NumPy setup solver uses finite-difference damped least squares, bounded angular steps and projected hard intervals against independently specified, source-checked chain constants. It is separate from TypeScript runtime FK/IK. Target orientation projects world-up into the plane perpendicular to optical −normal; world +Y is the fixed alternate when the optical axis is nearly vertical. Full matrix residuals control roll too.

Recomputed maximum endpoint emitter-position residual: **0.000000887mm**; full orientation angle residual: **0° at numerical trace precision**. Every result is finite, inside all joint intervals and below 5 mm/5°. These tiny numerical solver residuals do **not** improve the approximately millimeter tessellation/source accuracy or constitute metrology. Five-point browser selection/runtime solver/animation acceptance must be reconciled with this frozen route in issue7.

## Sampled clearance and speeds

`clearance.py` reads actual indexed door and all robot-body triangles, constructs the real scanner box, applies independent FK and checks 101 unique poses: 21 evenly spaced smoothstep fractions per transition, shared endpoints counted once. AABB filtering only excludes geometrically disjoint triangle candidates; VTK 9.3.1 checks actual remaining triangles for first contact. Home, every endpoint and intermediate samples have **zero robot/scanner-to-door triangle contacts**. Minimum robot/scanner Z is−9.2374e−17 m, numerical zero at the fixed base, so no sampled floor penetration.

Transition duration lower bounds are 5.934215,2.934500,1.000000,2.236212,2.075351seconds. Durations account for smoothstep's 1.5 maximum derivative and 10% authoritative rated speeds, so bounded interval interpolation respects the selected demo joint speeds. `assets/demo/clearance.json` retains method, count, residual floor datum and durations.

The [software setup montage](../../assets/demo/setup-poses.png) uses actual mesh triangles and independent FK at demo home and all five endpoints. It is a static visualization; the application browser preview is separately verified by the scene slice.

**Scope:** finite sampled static geometry check, not continuous collision detection, self-collision, physical-cell safety, runtime collision planning, guaranteed clearance at unsampled times or arbitrary points. No collision system enters the application.

## TDD and reproduction

First public CLI test failed with a missing verifier; minimal implementation then passed the actual five-target residual/bounds/floor behavior. A probe at Y0/Z700mm truthfully found no surface (window opening) and was replaced with an actual lower-skin location. The next public clearance test failed with a missing clearance CLI, then exposed actual triangle contacts rather than being weakened to accept them. Placement/home/route changes above made it green. Both public tests now pass.

Use isolated Python 3.12 tooling:

```sh
python3.12 -m venv /private/tmp/kakue-scene-setup-venv
/private/tmp/kakue-scene-setup-venv/bin/python -m pip install -r tools/scene-setup/requirements.txt
/private/tmp/kakue-scene-setup-venv/bin/python tools/scene-setup/verify.py
/private/tmp/kakue-scene-setup-venv/bin/python tools/scene-setup/clearance.py
/private/tmp/kakue-scene-setup-venv/bin/python tools/scene-setup/test_setup.py
/private/tmp/kakue-scene-setup-venv/bin/python tools/scene-setup/render.py
```

This run reused the accepted door-verification venv's NumPy 2.4.6/VTK 9.3.1 for numeric/contact checks. Native VTK rendering lacked a Cocoa OpenGL context and was replaced by deterministic Pillow software projection; the montage was produced with bundled Python 3.12, NumPy 2.3.5 and Pillow 12.3.0. Rendering dependencies do not enter runtime. Exact app development/production checks are recorded in issue3's main verification/handoff.

Recorded output SHA-256 for this accepted run:

- `assets/demo/manifest.json`: `cc7ee81acf96f3a738bd03010be31b7529361412d0316377c00ed243aac90d00`.
- `assets/demo/clearance.json`: `cb49275c74f6cdc0cbcce10de3242f425a36d1287ef89579f510057e2d7f8b7f` (elapsed time is run-specific; numeric verdict/count/durations are reproducible).
- `assets/demo/setup-poses.png`: `d8b2462a0c3ddc114854f135f591a95690f9b53dca305eb7e44192491db38ee2`.

Both the geometry agent and orchestrator inspected the actual setup montage: recognizable supplied robot and upright door, scanner at the intended surface approach, visible gap at home and no obvious endpoint penetration. This corroborates the finite numeric triangle checks without extending their scope.
