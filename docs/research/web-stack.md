# Web stack research — 2026-10-04

Decision: React + TypeScript + Vite + direct Three.js, browser STEP import using occt-import-js, immutable preprocessed robot definition/link meshes, and a fixed-six-joint numerical IK module. Read the [concise PRD](../../.scratch/robot-door-scan-demo/PRD.concise.md) first for the product contract and acceptance criteria; consult the unchanged [full PRD](../../.scratch/robot-door-scan-demo/PRD.md) only for additional explanation or ambiguity.

## Package baseline

The research agent checked primary npm registry metadata. These are version pins for implementation, not evidence that the complete app has already been installed or tested.

| Package | Pin | Primary source |
| --- | --- | --- |
| react / react-dom | 19.3.0 | [React metadata](https://registry.npmjs.org/react/latest), [React DOM metadata](https://registry.npmjs.org/react-dom/latest) |
| vite | 8.3.2 | [Vite metadata](https://registry.npmjs.org/vite/latest) |
| @vitejs/plugin-react | 6.1.1 | [Plugin metadata](https://registry.npmjs.org/@vitejs/plugin-react/latest) |
| typescript | 5.9.3 | [Pinned TypeScript metadata](https://registry.npmjs.org/typescript/5.9.3) |
| three | 0.186.1 | [Three metadata](https://registry.npmjs.org/three/latest) |
| @types/three | 0.186.0 | [Types metadata](https://registry.npmjs.org/@types/three/latest) |
| occt-import-js | 0.0.23 | [Importer metadata](https://registry.npmjs.org/occt-import-js/latest) |
| @playwright/test | 1.63.0 | [Playwright metadata](https://registry.npmjs.org/@playwright/test/latest) |

Use Node 24 LTS and a committed lockfile. Later latest metadata can change; verify the exact pins at install time rather than upgrading automatically.

## Reasons for these choices

- Direct Three.js supports a rigid six-link hierarchy and door-only raycasting without an extra React renderer abstraction. React handles controls/status; the scene lifecycle owns GPU resources and per-frame transforms.
- [occt-import-js](https://github.com/kovacsv/occt-import-js) handles STEP/IGES/BREP locally, including mesh positions/normals and CAD face associations. It does not read CATPart. Published 0.0.23 differs from repository-main version declarations, so use the published baseline explicitly.
- A browser worker keeps STEP parsing responsive. Same-origin JS/WASM assets avoid external upload services; preserve source bytes separately because transferred buffers are detached.
- Compile the verified robot description into a typed manifest and source-CAD GLB links offline. Subsequent geometry research established the joint match and grouping of the actual supplied STEP's main bodies; use those bodies instead of simplified reference DAE assets. One fixed model does not require runtime ROS, Xacro, or URDF loading.
- Implement a bounded position-and-orientation DLS solver directly against the verified six-axis chain. [Buss's survey](https://mathweb.ucsd.edu/~sbuss/ResearchWeb/ikmethods/iksurvey.pdf) is the method reference; seed count, joint bounds, orientation weighting, and demo tolerances are application decisions.
- A [Playwright browser workflow](https://playwright.dev/docs/downloads) is the main test seam, supplemented by independent coordinate/FK fixtures.

## Alternatives considered

- [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction): viable but unnecessary for the selected small imperative scene.
- [urdf-loader](https://github.com/gkjohnson/urdf-loaders): useful if runtime robot import later matters; it does not itself solve inverse kinematics.
- [Three CCDIKSolver](https://threejs.org/docs/pages/CCDIKSolver.html): designed around SkinnedMesh skeletons; not the selected rigid industrial arm/full-pose contract.
- [closed-chain-ik-js](https://github.com/gkjohnson/closed-chain-ik-js/releases/tag/v0.0.6): optional credible numerical implementation, but generalized machinery is unnecessary. Research found the author release and the similarly named npm package were not the same version baseline; do not assume npm latest represents the author release.
- Full OpenCascade.js: broader CAD manipulation API than this import-and-byte-passthrough requirement needs.
- Server rendering, backend CAD service, physics/collision engine, cloud point-cloud store: no corresponding MVP requirement.

## Authoritative asset

The user supplied the replacement `3d files/car-front-door-1/DOOR-of-CAR.step` on 2026-10-04. It is the sole demo door; all earlier door inputs and conversion research are superseded. No CATPart conversion is required. Preserve the exact supplied STEP bytes and verify its geometry independently under issue #1. A derived GLB cache does not replace the source STEP for download.

No additional web research tools were installed. The agent-reach search command was unavailable, so primary-source web/registry access was used. Its optional version check could not be verified because of network/DNS failure.
