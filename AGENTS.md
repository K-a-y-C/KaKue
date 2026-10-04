# Agent instructions

This repository implements the Robot Door Scan Demo. Before work, read `docs/agents/implementation-guide.md`, the complete `.scratch/robot-door-scan-demo/PRD.md`, your GitHub issue and its blockers. Use the PRD's domain vocabulary and acceptance gates.

The sole door input is `3d files/car-front-door-1/DOOR-of-CAR.step`. Ignore all earlier door assets; no CATPart conversion is required. Verify input hashes and availability before asset-dependent work. Never substitute geometry.

Implement one approved vertical slice at a time using one failing public behavior test → minimal passing implementation → refactor while green. Do not create horizontal layer tickets, write all tests upfront, or build speculative future scope. There is no backend/database requirement.

Keep README, verification evidence and issue handoffs current. Do not claim complete acceptance until the actual supplied assets and required production workflow pass.
