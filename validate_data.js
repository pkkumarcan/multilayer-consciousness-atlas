const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Simple schema validation function
function validateAgainstSchema(data, schema, pathPrefix = '') {
  const errors = [];

  if (schema.type === 'OBJECT') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      errors.push(`${pathPrefix || 'root'} should be an object`);
      return errors;
    }
    
    // Check required fields
    if (schema.required) {
      for (let req of schema.required) {
        if (!(req in data)) {
          errors.push(`${pathPrefix || 'root'}.${req} is required`);
        }
      }
    }

    // Validate properties
    for (let key in data) {
      if (schema.properties && schema.properties[key]) {
        const subErrors = validateAgainstSchema(
          data[key], 
          schema.properties[key], 
          pathPrefix ? `${pathPrefix}.${key}` : key
        );
        errors.push(...subErrors);
      }
    }
  } else if (schema.type === 'ARRAY') {
    if (!Array.isArray(data)) {
      errors.push(`${pathPrefix || 'root'} should be an array (got ${typeof data})`);
      return errors;
    }
    if (schema.items) {
      data.forEach((item, idx) => {
        const subErrors = validateAgainstSchema(item, schema.items, `${pathPrefix}[${idx}]`);
        errors.push(...subErrors);
      });
    }
  } else if (schema.type === 'STRING') {
    if (typeof data !== 'string') {
      errors.push(`${pathPrefix || 'root'} should be a string (got ${typeof data})`);
    } else {
      if (schema.enum && !schema.enum.includes(data)) {
        errors.push(`${pathPrefix || 'root'} must be one of: ${schema.enum.join(', ')}`);
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push(`${pathPrefix || 'root'} does not match pattern: ${schema.pattern}`);
        }
      }
    }
  } else if (schema.type === 'INTEGER') {
    if (!Number.isInteger(data)) {
      errors.push(`${pathPrefix || 'root'} should be an integer`);
    } else {
      if ('minimum' in schema && data < schema.minimum) {
        errors.push(`${pathPrefix || 'root'} must be at least ${schema.minimum}`);
      }
      if ('maximum' in schema && data > schema.maximum) {
        errors.push(`${pathPrefix || 'root'} must be at most ${schema.maximum}`);
      }
    }
  }

  return errors;
}

// Main Execution
const schemaPath = path.join(__dirname, 'schema', 'floor_schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const floorsDir = path.join(__dirname, 'content', 'floors');
const floorFiles = fs.readdirSync(floorsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

let anyFailed = false;

console.log('=== Consciousness Atlas Data Validation ===\n');

floorFiles.forEach(file => {
  const filePath = path.join(floorsDir, file);
  const rawText = fs.readFileSync(filePath, 'utf8');
  
  try {
    const data = yaml.load(rawText);
    const errors = validateAgainstSchema(data, schema);

    if (errors.length === 0) {
      console.log(`[PASS] ${file} is fully compliant with the schema!`);
    } else {
      anyFailed = true;
      console.log(`[FAIL] ${file} contains validation errors:`);
      errors.forEach(err => console.log(`  - ${err}`));
    }
  } catch (err) {
    anyFailed = true;
    console.error(`[ERROR] Failed to parse ${file}:`, err.message);
  }
});

console.log('\n=========================================');
if (anyFailed) {
  console.log('Validation failed. Please correct the errors above.');
  process.exit(1);
} else {
  console.log('All YAML content files successfully validated!');
  process.exit(0);
}
