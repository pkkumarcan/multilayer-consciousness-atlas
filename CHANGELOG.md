# Changelog

All notable changes to the Multilayer Consciousness Atlas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-05-30
### Added
*   **Monroe Institute "Gateway Experience" Integration**: Mapped all 50 empirical acoustic tapes across the 18 floors in `gateway_floor_mappings.json`.
*   **Programmatic YAML Merging**: Created `merge_gateway.js` to automatically merge Gateway mapping data blocks into YAML floor files while preserving custom developer comments.
*   **Epistemic Confidence Scale**: Added custom green, blue, amber, and red colored rating badges to represent empirical overlays (*Very Strong*, *Strong*, *Approximate*, *Speculative*).
*   **Monroe Map Limits**: Added warning callout alerts mapping Gateway system boundaries (e.g. at Floor 8/Trikuti boundary).
*   **Interactive Focus Level Nodes**: Configured 9 new `GATEWAY_NODES` inside `compile_graph.js` positioned relative to their parent Floor nodes. Styled with green fills (`#22c55e`) and dynamic filter checkbox triggers.
*   **Deep Search Capability**: Enhanced `search.js` keyword indexing to match queries against tape names, focus levels, descriptions, and bridge notes.
*   **Repository Assets Clean-up**: Standardized repository file layout by creating `assets/images/` and moving paintings, cosmic-maps, and PWA icons into it, updating corresponding links.

---

## [2.0.0] - 2026-05-30
### Added
*   **Modular Architecture**: Split monolithic script files into structured ES6 modules (`main.js`, `ui.js`, `graph.js`, `search.js`, `audio.js`, `energy.js`, and `state.js`).
*   **Three.js 3D Energy Map**: Added a translucent wireframe silhouette body map with 18 interactive glowing hotspots.
*   **Hash-Based URL Routing**: Implemented deep link hash listeners supporting direct sharing of specific floors (`#/floor/N`) and view states (`#/view/viewName`).
*   **Sacred Geometry Generator**: Added dynamic inline SVG yantra generation based on YAML petal properties.
*   **Continuous Breath Guide & Audio Synthesizers**: Added timed breathing loops (Pranayama) and multi-node oscillator Web Audio Synthesizers.
*   **PWA Offline Support**: Implemented `manifest.json` and `service-worker.js` offline capabilities.
*   **Mobile-Friendly Slider**: Added vertical timeline responsive collapse converting sidebar timelines into horizontal touch scrollbars.

---

## [1.0.0] - 2026-05-20
### Added
*   **Baseline Shell**: Initial project repository shell containing basic HTML layouts and local static floor visual representations.
