# The Multilayer Consciousness Atlas (Gen II)

Welcome to the **Multilayer Consciousness Atlas (Generation II)** — an interactive, entity-centric, offline-first Progressive Web Application (PWA) exploring the 18 spiritual floors, comparative mystical traditions, and modern neurobiological mappings.

This project is built using pure **Vanilla HTML, CSS, and JS** for high-performance rendering and relies on a structured, automated validation and compilation pipeline.

---

## 🎧 Core Conceptual Pillars
*   **The 18 Spinal Centers**: Maps Sant Mat cosmology (from Muladhara/Guda up to the nameless Radhasoami peak) across three macro-regions: *Pinda* (Physical/Astral), *Brahmanda* (Causal), and *Dayal Desh* (Pure Spirit).
*   **Monroe Institute Gateway Experience Integration**: Maps 50 empirical acoustic tapes across the spiritual spectrum, utilizing an **Epistemic Confidence Scale** (Very Strong, Strong, Approximate, Speculative) to benchmark Western phenomenological overlaps.
*   **Sacred Geometry (Yantras)**: Dynamically renders SVG sacred mandalas and radiating light-rays calculated from schema-defined petal counts.
*   **Web Audio Current Synthesizer**: Implements active sound transmutations (buzz of a honeybee, bell sound, thunder, bansuri flute) across the pharyngeal gate and causal peaks.
*   **Modern Neurobiology & Science**: Correlates subtle centers with Coccygeal and Sacral nerve plexuses, Vagus nerve networks, pineal/thalamus glands, and suppression patterns of the Default Mode Network (DMN).

---

## 🛠️ Repository & Modular Directory Structure

```
├── .github/workflows/
│   └── validate.yml               # GitHub Actions CI automated pipeline
├── assets/images/
│   ├── floor-*.png                # 12 standardized esoteric chakra paintings
│   ├── cosmic-map.png             # The complete macroscopic cartography image
│   └── icon_*.png                 # Maskable PWA app launcher icons
├── content/
│   ├── floors/
│   │   └── floor_*.yaml           # 18 YAML source-of-truth floor database files
│   ├── floors_db.json             # Combined dynamic client-side database (compiled)
│   └── content_graph.json         # Compiled knowledge graph semantic node list
├── schema/
│   ├── floor_schema.json          # Draft-07 JSON schema enforcing data compliance
│   └── mermaid_graph.md           # SVG-ready Compiled relationship graph visualization
├── main.js                        # PWA Service Worker registrar and app bootstrapper
├── ui.js                          # Collapsible lenses card renderers & accordion switches
├── graph.js                       # Interactive 2D SVG D3-style relationship graph layout
├── search.js                      # Deep keyword indexer matching text/tapes/phenomenology
├── audio.js                       # Web Audio API ambient tone synthesizer nodes
├── energy.js                      # Three.js 3D translucent wireframe silhouette map
├── state.js                       # Default global client states and spinal center tables
├── styles.css                     # Premium dark glassmorphic styling and mobile breakpoints
└── validate_data.js               # Structural validation engine validating YAML against Schema
```

---

## 🚀 Running Locally

To launch the project in your local development environment:

1.  **Install dependencies**:
    ```bash
    npm install
    ```
    *(Installs `js-yaml` which compiles source data YAML files).*

2.  **Run Local Web Server**:
    ```bash
    npm run dev
    ```
    This launches a zero-caching static HTTP server (usually on `http://localhost:8080` or similar port).

---

## ⚙️ Automated Data Pipeline

The Consciousness Atlas separates structural data from logic by treating the `content/floors/*.yaml` files as the single source of truth.

*   **Data Validation Check**:
    ```bash
    npm run validate
    ```
    Validates all 18 YAML content files against `schema/floor_schema.json`. Enforces required properties (`id`, `canonical_name`, `alternate_names`, `classification`, `canonical`, `comparative`, `science`, `phenomenology`, `memory`, `sources`, and `gateway_experience`).

*   **Knowledge Graph Compiler**:
    ```bash
    npm run compile
    ```
    Loads the validated YAML files and compiles them into a unified dynamic database (`floors_db.json`) and a 270-node relationship graph (`content_graph.json`). It also generates a structural Mermaid graph representation in `schema/mermaid_graph.md`.
