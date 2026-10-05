# Rectangular laser volume handoff

User-requested final amendment stacked on #10 PR #24, which stacks on #9 PR #23. [Plan](../plans/laser-volume.md), [verification](../verification/laser-volume.md). Review/merge in that order, manually.

The scene's existing setLaser(enabled, distance) interface now renders a rigid rectangular 3D frustum from an 80×60 mm aperture to a filled 240×180 mm end, four side walls and 117 distributed rays. Z scaling supplies the accepted 50–500 mm axial stand-off. The actual articulated emitter transform remains authoritative. Activation through approach/transit/dwell and immediate Stop/terminal extinction are unchanged. Public diagnostics derive rectangle corners/dimensions from actual geometry. Visual dimensions are illustrative rather than a physical scanner claim.

No dependencies, backend, selection data, IK/motion tolerances, source geometry or download contracts changed. Geometry disposal/picking exclusion use existing scene ownership rules. Production near/far and continuous Stop tests cover the amended behavior. Tests/browser/delivery.spec.ts accepts EVIDENCE_PREFIX so final hardware measurements do not overwrite historical delivery evidence.

Reproduce with Node 24: npm ci; npm run build; npm run verify:release; PREVIEW=1 npm test. Hardware acceptance: PREVIEW=1 PRESENTER=1 EVIDENCE_PREFIX=laser-volume npx playwright test tests/browser/delivery.spec.ts -g hardware. Host the complete verified static directory with the #10 MIME/base instructions. No automatic merge or deployment is performed.

Presenter launch now explicitly disables Chrome battery-saver and background timer/renderer/window scheduling throttles for reproducible active presentation measurements; it retains visible hardware Chrome and the unchanged ≥30 FPS threshold. Raw reports include page visibility/focus. This is a test launch setting, not a change to the user's normal browser preferences.
