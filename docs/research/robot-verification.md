# Supplied robot geometry verification — 2026-10-04

The supplied STEP was analyzed numerically from its actual geometric entities, independently of its filename. Direct cylindrical-axis/flange extraction agrees with the pinned ROS-Industrial KR 16 R1610 xacro's linkage geometry.

## Input identity

- Supplied robot STEP SHA-256: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`.
- AP214, NX 9.0 export dated 2018-04-17; one product, 73 BREP solids, no assembly occurrences.
- Length unit: millimeters, declared by STEP entity `#465997`.
- Declared model uncertainty: approximately 0.081886 mm.
- Joint source: [pinned xacro](https://github.com/isys-vision/kuka_experimental/blob/07b45e70914e2eb653215de7f95d7e665de9b867/kuka_kr16_support/urdf/kr16r1610cybertech_macro.xacro).

## Measured evidence

| Feature | Actual STEP evidence | Geometrical axis / plane |
| --- | --- | --- |
| Base swivel | Cylinder #11813, placement #180850 | Z axis through X=Y=0 |
| Shoulder | Cylinder #11735, placement #180022 | Y axis through X=160, Z=520 mm |
| Elbow | Cylinder #10756, placement #173989 | Y axis through X=160, Z=1300 mm |
| Forearm rotation | Cylinder #10704, placement #173050 | X axis through Y≈0, Z=1450 mm |
| Wrist bend | Cylinder #11262, placement #176490 | Y axis through X=815.000003067, Z=1450 mm |
| End flange | Plane #16600, placement #176460 | X-normal face at X=968.000003067, Y≈0, Z=1450 mm |

The flange is also supported by centered cylinder #11252 and eight radius-3 mm holes (#11253–#11260) on a 25 mm radius bolt circle.

Measured linkage dimensions: 520 mm shoulder height, 160 mm shoulder offset, 780 mm shoulder/elbow spacing, 655 mm horizontal and 150 mm vertical elbow/wrist offsets, and 153 mm wrist/flange spacing. These agree with the pinned chain.

Forward kinematics at (0°, −90°, +90°, 0°, 0°, 0°) predicts shoulder (160,0,520), elbow (160,0,1300), wrist (815,0,1450), and flange (968,0,1450) mm. Maximum extracted center discrepancy is 0.000003067 mm. This shows decimal CAD consistency, not physical manufacturing accuracy.

The base and source base-link frames coincide; source link 6 and flange coincide. Source tool0 is flange rotated +90° about local Y. All xacro mesh visual origins are identity.

## Excluded parameter file

The adjacent [OPW file](https://github.com/isys-vision/kuka_experimental/blob/07b45e70914e2eb653215de7f95d7e665de9b867/kuka_kr16_support/config/opw_parameters_kr16r1610cybertech.yaml) has 260 mm base offset, 675 mm shoulder height, 680 mm upper arm, and 158 mm flange offset. These do not directly reproduce the measured supplied geometry. No convention conversion was demonstrated. Use the verified chain with numerical IK instead.

## Meaning and limits

The axis/flange analysis establishes kinematic geometry compatibility. It does not, by itself, prove every DAE triangle matches the STEP solids. Static surfaces do not establish motor-positive rotation conventions or a payload rating; KR16/KR22 can share external geometry. Model limits/speeds come from the [official original KR 16 R1610 datasheet](https://www.kuka.com/-/media/kuka-downloads/imported/8350ff3ca11642998dbdc81dcc2ed44c/0000262125_cs.pdf) and match the selected xacro.

Do not use the extrema of every STEP CARTESIAN_POINT as a physical robot bounding box. Supporting surfaces/control points extend far beyond trimmed solids. Full bounds must come from actual BREP/tessellated surfaces.

## Completed surface comparison

The supplied file was genuinely tessellated with occt-import-js 0.0.23, in millimeters, 1 mm absolute linear deflection, and 0.25-radian angular deflection: 81 meshes / 730,266 triangles. The seven pinned reference DAE meshes contain 46,059 triangles. They were placed using the verified supplied CAD pose.

Every core CAD mesh was compared against every reference link using 100 deterministic area-weighted surface samples and exact closest-triangle distance. The chosen link correspondences are:

| Importer mesh indices | Runtime link | Largest sampled distance |
| --- | --- | --- |
| 73 | base | 1.703 mm |
| 8 | link 1 | 0.742 mm |
| 6, 7 | link 2 | 1.424 mm |
| 0, 1, 2 | link 3 | 0.732 mm |
| 5 | link 4 | 0.663 mm |
| 4 | link 5 | 0.668 mm |
| 3 | link 6 / flange | 0.768 mm |

Indices are tied to the source hash, parser version, and tessellation configuration; they are not general STEP entity identifiers. Competing link matches were generally much farther away.

A separate 3,000-area-sample reference-to-STEP check found median 0.133 mm and 95th percentile 2.111 mm, with 97.73% within 5 mm. Some reference link-1 details differ by up to about 17 mm in sampled checks. The reverse full-file comparison is much worse because the STEP contains broad lateral plates, under-base parts reaching Z=−150 mm, cabling, and an over-arm dress attachment absent from the reference. Consequently the full models are not identical.

**Decision:** use the supplied STEP's main bodies for runtime geometry, grouped using the mapping above and inverse-transformed by each joint's validated home-pose transform. Use the reference xacro for the measured-compatible joint skeleton, not its simplified DAE triangles as replacement visuals. Exclude the extra fixture/dress components for this MVP.

Distance calculations conservatively searched every triangle capable of improving the nearest-distance bound; the initial nearest-centroid-only estimates were discarded. These are exact nearest-surface distances for the sampled locations, not exhaustive Hausdorff bounds or proof of mesh identity.

The first six DAE files declare meter units and Z_UP; link 6 declares Y_UP and no unit (default meter). Do not assume a uniform COLLADA axis tag or blindly apply a loader axis conversion without preserving the verified link-frame placement. CAD-derived GLBs avoid this runtime ambiguity.

## Catalogue reach consistency

160 + 780 + square root of (655 squared + 150 squared) is approximately 1611.96 mm to the A5 wrist center, consistent with the published 1612 mm. The separate 153 mm flange extension and scanner mount are not part of that wrist-reference value. Runtime screening must not treat catalogue reach as a sphere about the floor datum for an extended scanner emitter; use the verified chain/tool and pose validation.

## Retained evidence

- Visual side/top comparison: `robot-shape-comparison.png`, retained in the supplied local workspace; not included in the GitHub text documentation.
- [Core link correspondence measurements](robot-core-mapping.json).
- [Exact sampled surface comparison](robot-surface-comparison.json).

The plot displays all supplied geometry on the left and the simplified researched link set on the right. It demonstrates why core shape compatibility is not whole-file identity.
