#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Function to analyze a file for function definitions
function analyzeFunctions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const exports = [];
    const definedFunctions = [];
    const missingFunctions = [];
    
    // Find exported functions
    let moduleExportsLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('module.exports')) {
        moduleExportsLine = i;
        
        // Extract function names from module.exports
        let exportsBlock = '';
        let j = i;
        let braceCount = 0;
        let started = false;
        
        while (j < lines.length) {
          const line = lines[j];
          exportsBlock += line;
          
          for (let k = 0; k < line.length; k++) {
            if (line[k] === '{') {
              started = true;
              braceCount++;
            } else if (line[k] === '}') {
              braceCount--;
              if (started && braceCount === 0) {
                // End of exports block
                j = lines.length; // Break outer loop
                break;
              }
            }
          }
          j++;
        }
        
        // Extract function names using regex
        const matches = exportsBlock.match(/\b\w+\b(?=\s*[,}])/g);
        if (matches) {
          exports.push(...matches);
        }
        
        break;
      }
    }
    
    // Find function definitions
    const functionRegex = /function\s+(\w+)\s*\(/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      definedFunctions.push(match[1]);
    }
    
    // Find arrow function definitions
    const arrowFuncRegex = /const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>/g;
    while ((match = arrowFuncRegex.exec(content)) !== null) {
      definedFunctions.push(match[1]);
    }
    
    // Check for missing functions
    for (const exportedFunc of exports) {
      if (!definedFunctions.includes(exportedFunc)) {
        missingFunctions.push(exportedFunc);
      }
    }
    
    return {
      file: path.basename(filePath),
      exports,
      definedFunctions,
      missingFunctions,
      moduleExportsLine
    };
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`);
    return null;
  }
}

// Main function
function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node function-checker.js <file-path>');
    process.exit(1);
  }
  
  const filePath = process.argv[2];
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const result = analyzeFunctions(filePath);
  
  if (!result) {
    console.error('Analysis failed');
    process.exit(1);
  }
  
  console.log('\n==== Function Analysis ====');
  console.log(`File: ${result.file}`);
  console.log(`\nExported functions (${result.exports.length}):`);
  result.exports.forEach(func => console.log(`- ${func}`));
  
  console.log(`\nDefined functions (${result.definedFunctions.length}):`);
  result.definedFunctions.forEach(func => console.log(`- ${func}`));
  
  if (result.missingFunctions.length > 0) {
    console.log(`\n⚠️  MISSING FUNCTIONS (${result.missingFunctions.length}):`);
    result.missingFunctions.forEach(func => console.log(`- ${func}`));
    
    console.log('\n✏️  ACTION REQUIRED:');
    console.log('Add the following function definitions before line', result.moduleExportsLine);
    
    result.missingFunctions.forEach(func => {
      console.log(`\nfunction ${func}() {\n  // Add implementation\n}`);
    });
  } else {
    console.log('\n✅ All exported functions are defined!');
  }
}

main();