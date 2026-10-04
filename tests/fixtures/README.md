# Independent STEP fixtures

Generated and reopened with native cadquery-ocp 7.8.1.1 (OpenCascade Python bindings), independently of the browser's occt-import-js 0.0.23 build.

- `box-mm.step`: closed box, millimeter declaration. Native bounds (mm) `(100,200,300)` to `(200,400,600)`, with bounding tolerance ~1e-7 mm.
- `box-inch.STP`: the same box authored with all coordinates and lengths divided by 25.4, and an INCH conversion-based unit. Native re-import confirms the same millimeter bounds to <1e-7 mm. Uppercase extension checks case-insensitive import.
- `point-only.step`: valid transferred vertex `(10,20,30)` mm, native reader status `IFSelect_RetDone`, one transferred root, zero faces. Exercises real successful parsing with no surfaces.

At the frozen +90° Z placement, independently calculated box base bounds are `(520.3385949134826,-1935.3724360466003,-67.240297)` to `(720.3385949134826,-1835.3724360466003,232.759703)` mm. The importer must preserve these coordinates and size; this generic fixture is intentionally below the floor at the fixed transform, with no automatic repositioning.

These synthetic files supplement accuracy/error tests. The supplied DOOR-of-CAR.step remains the sole demonstration input.
