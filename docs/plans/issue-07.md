# Issue 7 — ordered scanner route

Blocker #6 landed in PR #18. Retain React 19/TypeScript/Vite, direct Three.js and the existing same-origin full-pose IK worker. No dependency or framework change is needed.

Remove the temporary one-point Run restriction. Freeze the selection and stand-off at Run, preflight every target with the preceding verified pose, and block every motion if any target fails. Solved rows in a blocked route become Not visited; diagnostic rows retain Outside reach/Pose not solved. Only after successful whole-route preflight, play each bounded smoothstep transition from the preceding joint vector, show current point and visited count, dwell with laser for one second, then mark Visited. Completion retains the final pose and extinguishes the laser.

TDD increments: first a failing two-point public browser behavior for ordered progress/dwell/completion; minimal sequential implementation; then a failing later-target blocking test and truthful terminal row fix; then actual supplied-door five-point runtime acceptance. Real mouse clicks select actual mesh surfaces, with the frozen manifest route as independent geometry reference. Verify runtime endpoint residuals, intermediate joint intervals/peak speeds and reconcile numerical runtime paths with prior setup evidence. Do not use frozen solved angles as runtime answers.

Run focused development tests after each increment, independent actual-geometry checks, build and production Chrome acceptance. Record hashes, evidence, README and handoff. Stop and downloads remain issues #8/#9. User browser amendment is Chrome only.
