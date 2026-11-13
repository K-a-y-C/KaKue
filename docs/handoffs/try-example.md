# Example-start handoff

User request: remove the KaKue logos and let the presenter choose **Try example** on first load to open the supplied door automatically, then select points and Run as before.

Implemented on `codex/try-example-start`, from main `3e1e32b`. Both visible logos and their unused CSS/imports are removed. The opening button uses the existing hash-verified bundled STEP source and accepted geometry cache, sharing local import cancellation, readiness and errors. No model dimensions, transforms, robot definitions, motion or export contracts changed.

The example is explicit and reload returns to the choice. Missing/wrong source cannot fall back to another door; retry and local import remain available. A superseding import rejects late example results. Local STEP import remains covered independently.

Read the [plan](../plans/try-example.md) and [verification](../verification/try-example.md) for sequential red/green evidence, source hashes, commands/results and scope. Main #3/#4/#9/#30/#32 deliverables were inspected; the request supersedes their older import-only/logo presentation requirements. No issue #10 full-browser/hardware acceptance claim or main merge is made. Review/merge the PR manually.
