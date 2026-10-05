# Scan result export and motion lifecycle handoff

## Delivered behavior

- The laser stays off during the home-to-first-point approach. It activates at the verified first pose and remains continuous between subsequent scan points.
- After the final dwell, the laser switches off and the robot follows a bounded smooth joint interpolation back to the exact starting home vector. The session remains running and locked during return; Stop cancels/fixes the actual pose and preserves all visited rows. Only completed return produces successful completion.
- One Export control offers one ZIP containing the selected simulated point cloud PLY and coordinate CSV. Source CAD is excluded from result export. Blocked, stopped and failed runs retain their on-screen coordinates/statuses, with no successful-scan Export.
- A 4×4 m, 180 mm thick solid platform sits below Z=0. Neither model transform nor camera fitting changed.

## Contracts

`RunPlan`, `SelectedPoint` and immutable `DownloadSnapshot` retain their current data. Public `visit` activates illumination on endpoint arrival and preserves illumination across scan segments when requested. `returnHome` uses the same bounded animation/cancellation engine without illumination or scan dwell. `scanArchive` packages the two existing snapshot serializers using ZIP stored entries and CRC32; it rejects incomplete outcomes/empty/nonvisited points. No added dependency/backend.

## Evidence and scope

See [verification](../verification/scan-export-home-platform.md) for commands/results, red-green evidence and visual inspection. This branch also includes the already implemented import-first branded workspace, rectangular laser volume and static-delivery checks from the app shown in the presenter's screenshot; those local commits had not reached main at the start of this request. Latest main was merged cleanly before regression checks. Main remains unmodified by this task.

Item 6 contained no specified change. No claim of acquired measurements, reconstructed CAD, collision planning or new presenter-hardware acceptance is made. Historical issue evidence is retained at its prior delivery paths; the new PRD amendment governs current behavior.
