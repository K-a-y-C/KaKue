# Portfolio hosting — issue #36

Deploy the existing static application to `https://k-a-y-c.github.io/KaKue/` using standard Ubuntu GitHub Actions runners and Node 24. Pages is configured for workflow publishing with HTTPS enforced.

The workflow verifies source hashes, builds and verifies the complete release with `BASE_PATH=/KaKue/`, checks numerical behavior, and exercises actual supplied-door motion and ZIP exports through the production preview. Only main can upload the Pages artifact and deploy with Pages/OIDC permissions. Pull requests have read-only repository permissions and run verification without publishing. Deployment concurrency cancels superseded runs.

Local verification: genuine door SHA-256 `a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef` and robot SHA-256 `8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1` matched. Production build and release verification passed: 25 files, 41,749,523 bytes. The existing bundle size warning remains. Local build initially used Node 22.22.3; CI uses required Node 24. Browser checks run against `/KaKue/`, not the root path.

The existing PR #35 was independently verified at `/KaKue/` (7 example/branding browser checks passed, including a complete scan) and merged to supply the visitor-facing Try example flow. Local production route/export checks: 10 passed. Node 24 numerical checks: 9 passed. This deployment does not claim new hardware performance, browser compatibility or completion of unresolved #10 acceptance items.

Handoff: inspect the workflow in Actions after each main update; only share the website as successfully published after the deployment succeeds and HTTPS entry/assets are verified. Future merges retain the same URL. No credentials or paid services are added.
