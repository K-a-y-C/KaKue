# Retained source inputs

The user supplied the unchanged CAD files in `3d files/`. Their original paths are retained because they are the authoritative input paths in the PRD. The door JPGs and robot DXF are reference material only. No older door, CATPart, or replacement robot is included.

`manifest.json` records source identities. The robot joint description is copied verbatim from ROS-Industrial contributor isys-vision at commit `07b45e70914e2eb653215de7f95d7e665de9b867`; it is an unmerged community contribution, with its Apache-2.0 license retained alongside it. The selected motion limits and speeds are retained in the pinned xacro and PRD. The previously downloaded manufacturer “PDF” was found to be HTML and has been removed; independent original-model manufacturer corroboration is retained as [normalized numerical evidence](robot-joints/manufacturer-evidence.json) from a cached official KUKA PDF text extraction. All six ranges/speeds match the pinned xacro. Original PDF bytes were not recovered; this JSON is expressly not a PDF. These sources do not establish real-controller conventions or the supplied geometry's payload rating.

The researched OPW file is deliberately excluded: its dimensions do not reproduce the supplied CAD. Runtime primary bodies must derive from the supplied STEP. Reference images and research evidence do not replace geometry.

Raw files remain byte-identical. Runtime assets and the immutable RobotDefinition are prepared under issues #1 and #2. Asset checks and application commands are documented as those slices become available.
