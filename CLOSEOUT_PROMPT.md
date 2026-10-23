# Maintained viewer preservation checkpoint

Owner requested immediate source preservation. The viewer rewrite remains incomplete.

Repository: Ding-Ding-Projects/BlueMap
Implementation branch: codex/managed-map-chrome-20261022
Source snapshot branch: codex/bluemap-managed-map-preservation-20261023
Baseline: fcfea02697c23bbedb6960f16a6336ef85d14d5f

## Preserved source

Pinned Vuetify 3.13.0 and real components replace main toolbar, menu, buttons and form controls. The full-screen overlay is transparent instead of covering terrain. Renderer algorithms are unchanged.

## Verification

Locked npm installation and whitespace inspection completed. Actual root build, frontend build, terrain/resource/camera interaction, keyboard/layout/scale/language parity and current screenshots remain unverified. Remaining compass, day/night and view-switch controls still need conversion and review. No release or completed runtime result is claimed.

## Preservation routing

The immutable source snapshot is retained on the source snapshot branch while the original checked-out HEAD remains at its exact baseline for active parent source-privacy scans. After those scans settle, adopt the preserved snapshot into the owning implementation branch without discarding data. Reconcile the maintained target before integration and update the parent source pin only after the intended child source is pushed and verified.
