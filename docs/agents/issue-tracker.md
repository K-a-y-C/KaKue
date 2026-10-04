# Issue tracker: GitHub

Repository: [K-a-y-C/KaKue](https://github.com/K-a-y-C/KaKue).

GitHub issues are the implementation tracker. Read the approved issue backlog and the full PRD before implementing. Respect each issue's Blocked by references; ready-for-agent means specified, not unblocked.

Specification: `.scratch/robot-door-scan-demo/PRD.md`. Backlog: `.scratch/robot-door-scan-demo/issues/breakdown.md`. Agent workflow: `docs/agents/implementation-guide.md`.

The local workspace is now a real checkout of this repository. Supplied CAD and pinned joint/research source inputs are committed on `sources/verified-inputs` for manual review. Use isolated issue branches/checkouts for implementation; never assume a local commit has been published or a pending PR has landed. Only review branches may be pushed. The user reviews and merges PRs manually; do not push to main.
