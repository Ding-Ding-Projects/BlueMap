# BlueMap 5.29 integration handoff

The material-design-3 branch began at be3aa7a17e490f1daccad7f06b1fc01b35fe1ec8. Official v5.29 is a61e143fe1e069c536159e0bc79410d5b6da3885, 106 upstream commits after the old source pin. The merge applied without conflicts and retains all six fork contributions, including Material Design 3 components/tokens and the legacy 1.12 decoder. The API submodule is updated to the merged pin. Source integration is not build, rendering, UI or installer acceptance.

Root build.bat runs the actual Gradle CLI shadow-jar task, using an existing Java 25 or a pinned digest-verified user-scoped JDK. Gradle owns its pinned Node/webapp acquisition. No elevation or host restart is performed. build-installer.bat returns 2 with the exact reason that no standalone Windows installer target exists. Worldlens packages the desktop application separately.

Build and runtime verification, preservation push, default-branch integration, Worldlens submodule update and current screenshot evidence remain pending. Full universal-feature acceptance remains pending in Worldlens and the embedded viewer; preserve the existing UI while implementing missing capabilities.

The first root build stopped in the version probe before Gradle; using Java --version corrected its stderr handling. The second root build was stopped deliberately under measured host memory pressure, after exact wrapper/child identity checks. No build success is claimed. The next retry uses the registered :cli:shadowJar task, at most two workers, a 1536 MiB Gradle heap and in-process Kotlin compilation. The merged source remains an unverified preservation candidate.
