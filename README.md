# KaKue — Robot Door Scan Demo

KaKue is a planned desktop web demonstration of selecting scan locations on an automotive door and watching a six-axis robot visit them. It uses the supplied door CAD and robot geometry, with a wrist-mounted scanner and an illustrative red laser fan.

**Current status:** asset preparation tools, derived assets and verification records are being delivered in issues #1 and #2. The complete door-scan application remains pending its ordered implementation slices. The [PRD](.scratch/robot-door-scan-demo/PRD.md) is the implementation contract; ready-for-agent does not bypass the asset or production acceptance gates.

## Intended workflow

1. Load the prepared demo door or import a genuine STEP file locally in the browser.
2. Orbit, pan, and zoom; click the door surface to append numbered points and coordinates.
3. Choose a scanner stand-off from 50–300 mm and press Run.
4. Preflight every target against the verified robot chain and joint limits. When all targets pass, visit them in selection order with progress and a brief laser dwell.
5. Complete or Stop the simulation, then download selected surface points as PLY, coordinates and statuses as CSV, and the exact STEP bytes loaded by the session.

The robot and door have one fixed placement and retain their physical dimensions. Points cannot be deleted or reordered. Reloading or importing again begins a fresh session. Exports use robot-base coordinates in millimeters; camera movement never changes them.

This is a visual planning demonstration. It does not acquire scans, reconstruct surfaces, generate controller programs, connect to hardware, or perform collision checking. “Visited” means the simulated target and dwell completed.

## Asset gates

The sole authoritative door is `3d files/car-front-door-1/DOOR-of-CAR.step`. Earlier door assets are superseded; no CATPart conversion is needed. The supplied file is 14,456,880 bytes with SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`. Issue #1 independently reopened its actual surfaces in native OpenCascade, measured dimensions, checked the empty window and skin/frame probes, and prepared a meter-space GLB cache. Browser picking and final scene placement remain later acceptance gates. Preserve its exact bytes for the original STEP download.

Raw CAD and retained joint/research inputs are tracked after the manually merged source-intake PR. The [source manifest](assets/sources/manifest.json) records byte counts and SHA-256 identities; all retained entries were checked on 2026-10-04. The [source notes](assets/sources/README.md) explain provenance, reference-only material, and the retained license. An implementation agent must still recheck the exact geometry hashes in its checkout before asset preparation.

The supplied robot's pivot geometry and main-body correspondence have been numerically checked. Runtime preparation remains: derive rigid-link GLBs from the supplied STEP using the PRD's verified mapping, reassemble them at the verified CAD pose, and record the geometry and joint definitions in one immutable manifest used by rendering and kinematics. Reference robot meshes are comparison evidence rather than replacement runtime geometry.

Before accepting the demo, freeze and verify the actual door placement, home pose, flange-to-emitter mount, and a representative five-point route. Missing assets must remain explicit; substitutes cannot satisfy acceptance.

### Door preparation

Door preparation (Node 24 LTS, from the repository root):

```sh
npm ci --prefix tools/assets
npm --prefix tools/assets run validate:door
npm --prefix tools/assets run prepare:door
npm --prefix tools/assets run validate:door -- --cache ../../assets/door
npm test --prefix tools/assets
```

The [door manifest](assets/door/manifest.json) records original identity and reproducible cache/settings. The [verification record](docs/verification/issue-01.md) explains independent CAD bounds, sampled accuracy, topology limitations and native reproduction commands. The STEP includes a loose construction edge below the actual door; use **surface** bounds for floor placement. Its two tiny omitted faces remain within the measured 5 mm cache tolerance. Preserve original STEP bytes for the separate unchanged download. No door transform or reachable route is accepted by this slice.

## Planned stack

The PRD selects React, TypeScript, Vite, direct Three.js, `occt-import-js` in a Web Worker, and Playwright browser acceptance tests. It specifies Node 24 LTS and a committed lockfile. Exact research version pins are in [web stack research](docs/research/web-stack.md); they are an implementation baseline, not installed or integration-tested dependencies.

The application is a client-side static build. STEP parsing and pose preparation stay local; parser JavaScript and WASM are served as versioned same-origin assets. No backend, account, database, runtime ROS parser, or external conversion service is required.

## Start development

Read the [PRD](.scratch/robot-door-scan-demo/PRD.md), [implementation guide](docs/agents/implementation-guide.md), [robot verification evidence](docs/research/robot-verification.md), and [stack decisions](docs/research/web-stack.md) before implementing. Follow the [ordered issue backlog](.scratch/robot-door-scan-demo/issues/breakdown.md) and select an approved [GitHub issue](https://github.com/K-a-y-C/KaKue/issues) whose blockers are complete. Asset preparation and evidence are prerequisites for accepting work that relies on the real door or runtime robot geometry.

The first application slice should establish the package manifest, pinned dependencies, lockfile, and working development/build/preview/test scripts. Add their verified commands here once they exist; the door preparation commands above do not run the application.

## Working in vertical slices with TDD

Each issue should deliver one narrow, observable path through the relevant UI, worker, scene, data, and download boundaries. Keep slices independently demoable and implement blockers first. Do a small prefactor first only when it makes the next behavior easier to add safely; avoid separate layer-wide implementation tickets.

For each behavior, use a red–green–refactor loop:

1. Write one failing test of observable behavior through a stable boundary.
2. Implement the smallest complete path that passes it.
3. Refactor while the test stays green, then repeat for the next behavior.

Use the full browser workflow as the primary acceptance seam. Supplement it with independent geometry/coordinate fixtures and downloaded-file readers. Avoid tests that merely duplicate implementation math or assert private component structure. Synthetic STEP fixtures can test errors and accuracy, but cannot replace the supplied door for final acceptance.

Required evidence includes correct surface picking and drag filtering, ordered five-point motion within joint limits, emitter residuals within 5 mm and 5°, truthful blocked/Stop outcomes, identical selected surface coordinates in PLY/CSV, and an unchanged STEP hash. Verify the static production build, target desktop layouts, Chrome/Edge, Safari smoke behavior, and the PRD's performance target on the presenter's machine.

## Project references

- [Product requirements and acceptance criteria](.scratch/robot-door-scan-demo/PRD.md)
- [Implementation guide](docs/agents/implementation-guide.md)
- [Ordered issue backlog](.scratch/robot-door-scan-demo/issues/breakdown.md)
- [GitHub issue tracker](https://github.com/K-a-y-C/KaKue/issues)
- [Robot geometry measurements and retained evidence](docs/research/robot-verification.md)
- [Web stack selection and version baseline](docs/research/web-stack.md)
- [Issue tracker configuration](docs/agents/issue-tracker.md)
- [Triage vocabulary](docs/agents/triage-labels.md)

Record source hashes, preprocessing settings, dependency pins, and applicable asset/dependency license notices with implementation. No repository-wide license or permission to redistribute supplied CAD is established by this README.
