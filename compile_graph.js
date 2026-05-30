const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const floorsDir = path.join(__dirname, 'content', 'floors');
const floorFiles = fs.readdirSync(floorsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

const nodes = [];
const edges = [];

const nodeIds = new Set();
const edgeKeys = new Set();

// Helper to add a node uniquely in O(1)
function addNode(id, name, type, details = {}) {
  if (!nodeIds.has(id)) {
    nodeIds.add(id);
    nodes.push({ id, name, type, ...details });
  }
}

// Helper to add an edge uniquely in O(1)
function addEdge(source, target, relation) {
  const key1 = `${source}_${target}_${relation}`;
  const key2 = `${target}_${source}_${relation}`;
  if (!edgeKeys.has(key1) && !edgeKeys.has(key2)) {
    edgeKeys.add(key1);
    edges.push({ source, target, relation });
  }
}

// Helper to slugify text into valid IDs
function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_');
}

console.log('=== Compiling Consciousness Knowledge Graph ===\n');

const floorsDB = {};

floorFiles.forEach(file => {
  const filePath = path.join(floorsDir, file);
  const rawText = fs.readFileSync(filePath, 'utf8');
  
  try {
    const floor = yaml.load(rawText);
    
    // Cache in dynamic client database
    floorsDB[floor.id] = floor;
    
    // 1. Add Floor Node
    const floorId = floor.id;
    const floorName = floor.canonical_name;
    addNode(floorId, floorName, 'Floor', {
      level: floor.classification.level,
      realm: floor.classification.realm,
      category: floor.classification.category
    });

    // 2. Add Ruler Node & Edge
    if (floor.canonical.ruler) {
      const rulerId = `ruler_${slugify(floor.canonical.ruler)}`;
      addNode(rulerId, floor.canonical.ruler, 'Ruler');
      addEdge(floorId, rulerId, 'hasRuler');
    }

    // 3. Add Sound Node & Edge
    if (floor.canonical.sound) {
      const soundId = `sound_${slugify(floor.canonical.sound.split('(')[0].trim())}`;
      addNode(soundId, floor.canonical.sound, 'Sound');
      addEdge(floorId, soundId, 'hasSound');
    }

    // 4. Add Light Node & Edge
    if (floor.canonical.light) {
      const lightId = `light_${slugify(floor.canonical.light.split('(')[0].trim())}`;
      addNode(lightId, floor.canonical.light, 'Light');
      addEdge(floorId, lightId, 'hasLight');
    }

    // 5. Add Comparative Tradition Nodes & Edges
    if (floor.comparative) {
      for (let tradition in floor.comparative) {
        const comp = floor.comparative[tradition];
        if (comp.term) {
          const compId = `comp_${tradition}_${slugify(comp.term)}`;
          addNode(compId, comp.term, 'Comparative', { tradition, description: comp.description });
          addEdge(floorId, compId, `mapsTo_${tradition}`);
        }
      }
    }

    // 6. Add Science / Neuroscience Nodes & Edges
    if (floor.science && floor.science.neuroscience) {
      const neuro = floor.science.neuroscience;
      if (neuro.regions) {
        neuro.regions.forEach(region => {
          const regionId = `region_${slugify(region)}`;
          addNode(regionId, region, 'BrainRegion');
          addEdge(floorId, regionId, 'correlatesToBrainRegion');
        });
      }
      if (neuro.networks) {
        neuro.networks.forEach(network => {
          const networkId = `network_${slugify(network)}`;
          addNode(networkId, network, 'BrainNetwork');
          addEdge(floorId, networkId, 'correlatesToBrainNetwork');
        });
      }
    }

    console.log(`Parsed and linked nodes for ${floorName}`);

  } catch (err) {
    console.error(`Failed to process ${file}:`, err.message);
  }
});

// Gateway Experience nodes — one per unique Focus level per floor
const GATEWAY_NODES = [
  { id: "gw_focus3",    label: "Focus 3\nOrientation",         type: "Gateway", floor: 1,  color: "#22c55e" },
  { id: "gw_focus10",   label: "Focus 10\nMind Awake/Body Asleep", type: "Gateway", floor: 2,  color: "#22c55e" },
  { id: "gw_focus12",   label: "Focus 12\nExpanded Awareness", type: "Gateway", floor: 5,  color: "#22c55e" },
  { id: "gw_focus15",   label: "Focus 15\nNo-Time",            type: "Gateway", floor: 7,  color: "#22c55e" },
  { id: "gw_focus21",   label: "Focus 21\nBridge State",       type: "Gateway", floor: 9,  color: "#22c55e" },
  { id: "gw_focus23",   label: "Focus 23\nPost-Physical Zone", type: "Gateway", floor: 11, color: "#22c55e" },
  { id: "gw_focus25",   label: "Focus 25\nBelief Territories", type: "Gateway", floor: 12, color: "#22c55e" },
  { id: "gw_focus27",   label: "Focus 27\nReception Centre",   type: "Gateway", floor: 12, color: "#22c55e" },
  { id: "gw_focus3435", label: "Focus 34/35\nThe Absolute",    type: "Gateway", floor: 17, color: "#22c55e" },
];

GATEWAY_NODES.forEach(node => {
  addNode(node.id, node.label, node.type, { floor: node.floor, color: node.color });
  addEdge(node.id, `floor_${node.floor}`, "hasPracticeEntry");
});

// Compile and output graph JSON
const graph = { nodes, edges };
const graphPath = path.join(__dirname, 'content', 'content_graph.json');
const dbPath = path.join(__dirname, 'content', 'floors_db.json');

// Ensure content directory exists
if (!fs.existsSync(path.join(__dirname, 'content'))) {
  fs.mkdirSync(path.join(__dirname, 'content'));
}

// Add compiled_at timestamp metadata wrapper
const floorsDBWithMetadata = {
  metadata: {
    compiled_at: Date.now()
  },
  ...floorsDB
};

fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf8');
fs.writeFileSync(dbPath, JSON.stringify(floorsDBWithMetadata, null, 2), 'utf8');

console.log(`\nSuccessfully wrote combined graph to ${graphPath}`);
console.log(`Successfully wrote consolidated database to ${dbPath}`);
console.log(`Total Nodes: ${nodes.length}`);
console.log(`Total Edges: ${edges.length}\n`);

// Generate Mermaid representation
let mermaid = 'graph TD\n';
mermaid += '  %% Styles\n';
mermaid += '  classDef floor style fill:#A32D2D,stroke:#333,stroke-width:2px,color:#fff;\n';
mermaid += '  classDef sound style fill:#8fa3b8,stroke:#333,stroke-width:1px,color:#000;\n';
mermaid += '  classDef ruler style fill:#c4a96a,stroke:#333,stroke-width:1px,color:#000;\n';
mermaid += '  classDef comp style fill:#3B6D11,stroke:#333,stroke-width:1px,color:#fff;\n';
mermaid += '  classDef neuro style fill:#1D9E75,stroke:#333,stroke-width:1px,color:#fff;\n\n';

nodes.forEach(n => {
  let shape = `["${n.name}"]`;
  if (n.type === 'Floor') shape = `(("${n.name}"))`;
  mermaid += `  ${n.id}${shape}\n`;
  if (n.type === 'Floor') mermaid += `  class ${n.id} floor;\n`;
  else if (n.type === 'Sound') mermaid += `  class ${n.id} sound;\n`;
  else if (n.type === 'Ruler') mermaid += `  class ${n.id} ruler;\n`;
  else if (n.type === 'Comparative') mermaid += `  class ${n.id} comp;\n`;
  else if (n.type === 'BrainRegion' || n.type === 'BrainNetwork') mermaid += `  class ${n.id} neuro;\n`;
});

mermaid += '\n';

edges.forEach(e => {
  mermaid += `  ${e.source} -->|"${e.relation}"| ${e.target}\n`;
});

const mermaidPath = path.join(__dirname, 'schema', 'mermaid_graph.md');
fs.writeFileSync(mermaidPath, `# Compiled Relationship Graph (Mermaid)\n\n\`\`\`mermaid\n${mermaid}\`\`\`\n`, 'utf8');
console.log(`Successfully generated Mermaid graph representation in ${mermaidPath}`);
