const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const mappingsPath = path.join(__dirname, 'gateway_floor_mappings.json');
const mappingsData = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
const mappings = mappingsData.gateway_experience_floor_mappings;

console.log('=== Starting Gateway Experience Automated Merging ===\n');

for (let i = 1; i <= 18; i++) {
  const floorId = `floor_${i}`;
  const filePath = path.join(__dirname, 'content', 'floors', `${floorId}.yaml`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] File not found: ${filePath}`);
    continue;
  }
  
  let rawText = fs.readFileSync(filePath, 'utf8');
  
  // Idempotency check: remove any existing gateway_experience block from previous runs
  const index = rawText.indexOf('\ngateway_experience:');
  if (index !== -1) {
    rawText = rawText.substring(0, index);
  }
  
  // Clone data to avoid mutating original source
  const gatewayData = JSON.parse(JSON.stringify(mappings[floorId]));
  
  // Clean null values for map_limit_note to comply with single-type Draft-07 schema validator
  if (gatewayData.map_limit_note === null) {
    delete gatewayData.map_limit_note;
  }
  
  // Format the YAML block beautifully
  const yamlString = yaml.dump({ gateway_experience: gatewayData }, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"'
  });
  
  // Trim and append to preserve comments and layout integrity
  rawText = rawText.trim() + '\n\n' + yamlString;
  fs.writeFileSync(filePath, rawText, 'utf8');
  console.log(`[MERGE] Merged gateway_experience into ${floorId}.yaml`);
}

console.log('\n=== Gateway Experience Automated Merging Completed! ===');
