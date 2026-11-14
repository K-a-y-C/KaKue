# Portfolio hosting

The portfolio uses neutral Scan Studio branding and is published at `https://k-a-y-c.github.io/scan-studio/`. The repository name supplies the Pages base path through `BASE_PATH=/${{ github.event.repository.name }}/`. Pages uses workflow publishing with HTTPS enforced.

The workflow verifies source hashes, builds and checks the complete release, runs numerical checks, and exercises branding, local CAD import, actual supplied-door motion, Stop outcomes and ZIP exports through production Chrome. Only main can upload the Pages artifact and deploy with Pages/OIDC permissions. Pull requests verify without publishing. Standard Ubuntu runners and Node 24 are used; no deployment credentials or paid services are added.

## Neutral portfolio verification — 2026-11-14

The public behavior check first failed on the old browser title, then passed after changing the browser title and workspace heading to Scan Studio. The unused company logo asset was removed. No geometry, camera, motion, import or export implementation changed. The production output contains no company-name text.

Both supplied SHA-256 identities match:

- Door: `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef`
- Robot: `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1`

`BASE_PATH=/scan-studio/ npm run build` and `BASE_PATH=/scan-studio/ npm run verify:release` passed: 24 files, 41,733,537 bytes. The existing bundle-size warning remains. All nine numerical checks passed using Node 24. All four release-integrity tests passed against their expected root-path build. All 17 production Chrome checks passed under `/scan-studio/` in 3.8 minutes. Production browser verification covers the renamed base path, both desktop layouts, imported/example CAD, complete routes at 100/500 mm, failure/Stop behavior and independently parsed matching PLY/CSV ZIP output.

Handoff: the repository rename changes the public Pages path. Share the new URL after the main deployment succeeds and its HTTPS entry, model assets, parser/WASM, motion and export have been checked. Existing unresolved issue #10 hardware/browser acceptance is unchanged.
