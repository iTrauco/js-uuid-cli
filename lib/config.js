// lib/config.js
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = '.uuid-cli-config.json';
const BACKUP_DIR = '.uuid-cli-backups';
const SKIP_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage', BACKUP_DIR];

// Default configuration
const defaultConfig = {
  includeBranch: true,
  includeCommit: true,
  includeTimestamp: true,
  includeLineNumber: true,
  excludeDirs: [...SKIP_DIRS]
};

let config = { ...defaultConfig };
let lastRunInfo = {
  timestamp: null,
  files: []
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      
      // Load config
      if (data.config) {
        config = data.config;
      }
      
      // Load last run info
      if (data.lastRun) {
        lastRunInfo = data.lastRun;
      }
      
      // Initialize excludeDirs if undefined
      if (!config.excludeDirs) {
        config.excludeDirs = [...SKIP_DIRS];
      }
      
      console.log('Loaded configuration:', config);
    }
  } catch (error) {
    console.error('Error loading config:', error.message);
  }
}

function saveConfig() {
  try {
    // Save both config and last run info
    const data = {
      config,
      lastRun: lastRunInfo
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
    console.log('Configuration saved.');
  } catch (error) {
    console.error('Error saving config:', error.message);
  }
}

function resetConfig() {
  config = { ...defaultConfig };
  return config;
}

function getConfig() {
  return config;
}

function updateConfig(newConfig) {
  config = { ...newConfig };
}

function getLastRunInfo() {
  return lastRunInfo;
}

function updateLastRunInfo(newInfo) {
  lastRunInfo = { ...newInfo };
  saveConfig();
}

function getConstants() {
  return {
    CONFIG_FILE,
    BACKUP_DIR,
    SKIP_DIRS
  };
}

module.exports = {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfig,
  updateConfig,
  getLastRunInfo,
  updateLastRunInfo,
  getConstants
};