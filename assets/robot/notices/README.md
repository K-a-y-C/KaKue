# Robot preparation notices

Runtime rigid-link geometry derives only from the user's supplied `3d files/Robot/KR22_R1610-KR16_R1610.stp`; no researched DAE mesh is redistributed as replacement geometry. The repository records user-supplied provenance without adding a repository-wide CAD license.

The compiled joint chain derives from the isys-vision ROS-Industrial contribution pinned to `07b45e70914e2eb653215de7f95d7e665de9b867`, under the retained Apache-2.0 [license](../../sources/robot-joints/LICENSE). The original xacro remains in `assets/sources/robot-joints` and includes its source relationship; this contribution is not an official manufacturer release.

`occt-import-js@0.0.23` is used only for build-time robot preparation. Retained notices: `license.occt-import-js.txt` and `license.occt.txt`. Its npm distribution includes importer source under `occt-import-js/`; the complete corresponding pinned distribution is reproducibly available with `npm pack occt-import-js@0.0.23`. Upstream source: https://github.com/kovacsv/occt-import-js (importer) and https://dev.opencascade.org/release (OCCT). Preserve these notices and source availability when distributing the parser/WASM in later application slices; this slice does not distribute parser/WASM binaries as runtime assets.

Three.js preview dependency: `three@0.186.1`, MIT; retained `three-LICENSE`. Preparation package lock records exact resolved tarball/integrity for dependencies. Playwright is development-only, Apache-2.0; its npm package includes LICENSE and NOTICE. TypeScript is development-only, Apache-2.0; its npm package includes LICENSE.txt.

Manufacturer facts are retained as a clearly qualified normalized JSON record from cached official original-model KUKA PDF text. Original PDF bytes were not recovered; no HTML redirect response is represented as a manufacturer PDF. See [manufacturer evidence](../../sources/robot-joints/manufacturer-evidence.json).
