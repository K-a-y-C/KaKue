# Browser dependency notices

The application uses React 19.3.0, React DOM 19.3.0 and its lockfile-resolved Scheduler (MIT); Three.js 0.186.1 (MIT). Original package license texts are retained alongside this note and copied into the production build at `demo-v1/notices/`.

CAD and joint-definition provenance/notices remain in `assets/sources`, `assets/robot/notices` and `tools/assets/notices`. Prepared runtime meshes retain their supplied source identities. No repository-wide CAD redistribution permission is asserted.

The unmodified `occt-import-js` 0.0.23 JavaScript/WASM distribution is served at `parser/occt-import-js/0.0.23/`. Both published LGPL-2.1 license texts accompany those files. The exact npm archive, including importer sources and build scripts, is pinned by integrity in the root lockfile: https://registry.npmjs.org/occt-import-js/-/occt-import-js-0.0.23.tgz. Upstream: https://github.com/kovacsv/occt-import-js; OCCT source/build provenance qualifications remain in `tools/assets/notices/README.md`. No modified/rebuilt OCCT binary is distributed. Runtime provenance records file hashes in the same directory's `manifest.json`.
