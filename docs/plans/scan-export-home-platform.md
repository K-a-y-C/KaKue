# Scan result export, home return and grounded scene

User-approved scope (2026-10-05): implement the five requested changes; item 6 has no requirement. This amendment supersedes prior requirements for separate downloads, home-approach laser activation and ending at the final target.

1. One public execution regression: laser stays off during home approach, activates at arrival, stays on between scan points, extinguishes for home return/Stop/failure. Red → minimal passing behavior.
2. One actual-door browser regression: completion waits for a bounded animated return to the exact starting home vector, with laser off. Stop during return freezes pose and retains visited rows.
3. One browser export regression: only successful completion exposes Export; one ZIP contains the point cloud PLY and coordinate CSV from the same immutable snapshot. Independently unzip and parse files; omit source CAD from result exports and UI text. Keep simulation provenance honest.
4. Add a solid shared platform beneath Z=0 without moving/scaling robot or door or altering camera framing. Visually inspect actual geometry and confirm platform clicks cannot select points.
5. Update obsolete tests/specification amendments, README and handoff; run numerical/release/browser tests and static production workflow. Fetch/merge current main, resolve conflicts, repeat checks if necessary, commit and publish review PR. No main push/merge.

Both supplied input hashes verified against the implementation guide before work. Preserve existing CAD and mathematical acceptance evidence. Automated checks do not claim presenter hardware or Safari acceptance.
