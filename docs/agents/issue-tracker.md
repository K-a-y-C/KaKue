# Issue tracker: GitHub

Repository: [K-a-y-C/KaKue](https://github.com/K-a-y-C/KaKue).

GitHub issues are the implementation tracker. Read the approved issue backlog and `.scratch/robot-door-scan-demo/PRD.concise.md` first before implementing; consult the synchronized full PRD only for additional explanation or ambiguity. Story numbers and specification headings are preserved. Respect each issue's Blocked by references; ready-for-agent means specified, not unblocked.

First-read specification: `.scratch/robot-door-scan-demo/PRD.concise.md`. Authoritative full reference: `.scratch/robot-door-scan-demo/PRD.md`. Backlog: `.scratch/robot-door-scan-demo/issues/breakdown.md`. Agent workflow: `docs/agents/implementation-guide.md`.

The local workspace is now a real checkout of this repository. Supplied CAD and pinned joint/research source inputs are committed on `sources/verified-inputs` for manual review. Use isolated issue branches/checkouts for implementation; never assume a local commit has been published or a pending PR has landed. Only review branches may be pushed. The user reviews and merges PRs manually; do not push to main.

Issue #21 supersedes the old #6/#7 laser, transition and stand-off requirements and must land before #9. Its technical plan is `docs/plans/issue-21.md`; verification and handoff are in `docs/verification/issue-21.md` and `docs/handoffs/issue-21.md`.
