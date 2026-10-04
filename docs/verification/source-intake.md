# Source intake — 2026-10-04

Repository base: 6aa8531540ad30af48674f6c7150e99a28f8b894. Review branch: sources/verified-inputs. No changes were pushed to main.

All eight entries in assets/sources/manifest.json were read independently with Python hashlib SHA-256 and checked against their byte counts. The supplied door is 14,456,880 bytes and matches a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef. The supplied robot is 34,148,428 bytes and matches 8b6808af0ca85237dbf5dd73624385ae5fdf36654ef6fd6e4c6cd277683f96a1.

The retained xacro was compared with `cmp` against a fresh copy from the pinned 07b45e70914e2eb653215de7f95d7e665de9b867 source. Its upstream LICENSE is retained. The manufacturer datasheet and previous measurement/image records are retained as reference evidence. The CAD axis crosscheck runs from the repository path; its home flange result agrees with the recorded measurements.

This verifies intake identity and provenance, not door geometry, exported mesh accuracy, application behavior, or final acceptance. Those gates remain with their dedicated issues. The obsolete CATPart conversion caveat in the earlier stack research was corrected to agree with the replacement-door PRD.
