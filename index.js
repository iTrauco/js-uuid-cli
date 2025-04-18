#!/usr/bin/env node
// index.js - Main entry point for UUID CLI
const configManager = require('./lib/config.js');
const cli = require('./lib/cli');

console.log("Loading modules...");
try {
  const config = require('./lib/config');
  console.log("Config loaded:", Object.keys(config));
  
  const backupManager = require('./lib/backup-manager');
  console.log("Backup manager loaded:", Object.keys(backupManager));
  
  const fileProcessor = require('./lib/file-processor');
  console.log("File processor loaded:", Object.keys(fileProcessor));
} catch (error) {
  console.error("Error loading modules:", error);
}


/**
 * Main entry point
 */
function main() {
  // Load configuration
  configManager.loadConfig();
  
  // Process command line arguments or show menu
  const hasProcessedArgs = cli.processArgs(process.argv);
  
  if (!hasProcessedArgs) {
    // Interactive mode
    cli.showMenu();
  }
}

// Start the application
main();