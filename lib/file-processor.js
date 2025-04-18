// lib/file-processor.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const configManager = require('./config.js');
const gitUtils = require('./git-utils');
const backupManager = require('./backup-manager');

/**
 * Generates a short UUID
 * @returns {string} Generated UUID
 */
function generateShortUUID() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Checks if a path is in an excluded directory
 * @param {string} fullPath Path to check
 * @returns {boolean} True if path is excluded
 */
function isInExcludedPath(fullPath) {
  const config = configManager.getConfig();
  
  // Check if this path or any of its parent paths are in the excluded list
  const relativePath = path.relative(process.cwd(), fullPath);
  const pathParts = relativePath.split(path.sep);
  
  // Check if any directory in the path is excluded
  for (let i = 0; i < pathParts.length; i++) {
    if (config.excludeDirs.includes(pathParts[i])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Adds UUIDs to a file
 * @param {string} filePath Path to the file
 * @param {string} scriptFileName Name of the script file to skip
 * @returns {Object|null} Backup information or null if processing failed
 */
function addUUIDsToFile(filePath, scriptFileName) {
  try {
    if (path.basename(filePath) === scriptFileName) {
      console.log(`Skipping self: ${filePath}`);
      return null;
    }
    
    // Create backup first
    const backup = backupManager.backupFile(filePath);
    if (!backup) return null;
    
    const config = configManager.getConfig();
    const { branch, lastCommit } = gitUtils.getGitInfo();
    const timestamp = new Date().toISOString();
    
    // Debug log for git info
    console.log(`Git info for ${filePath}: branch=${branch}, commit=${lastCommit}`);
    
    // Build meta info string based on config
    let metaParts = [];
    if (config.includeBranch && branch) metaParts.push(`branch:${branch}`);
    if (config.includeCommit && lastCommit) metaParts.push(`commit:${lastCommit}`);
    if (config.includeTimestamp) metaParts.push(`time:${timestamp}`);
    const metaInfo = metaParts.join('|');
    
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const updatedLines = lines.map((line, index) => {
      const lineNumber = index + 1;
      let cleanLine = line;
      
      if (line.includes('// ')) {
        cleanLine = line.substring(0, line.indexOf('// '));
      }
      
      let comment = ' // ';
      if (metaInfo) comment += `${metaInfo} `;
      if (config.includeLineNumber) comment += `line:${lineNumber} `;
      comment += `uuid:${generateShortUUID()}`;
      
      if (cleanLine.trim() === '') {
        return comment.trim();
      }
      
      return `${cleanLine.trimEnd()}${comment}`;
    });
    
    fs.writeFileSync(filePath, updatedLines.join('\n'));
    console.log(`Updated: ${filePath}`);
    
    return backup;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Processes a directory recursively
 * @param {string} dirPath Path to the directory
 * @param {string} scriptFileName Script filename to skip
 * @returns {Array} Array of modified files
 */
function processDirectory(dirPath, scriptFileName) {
  const modifiedFiles = [];
  
  // Skip if this directory or any parent directory is excluded
  if (isInExcludedPath(dirPath)) {
    console.log(`Skipping excluded path: ${dirPath}`);
    return modifiedFiles;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const config = configManager.getConfig();
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (!config.excludeDirs.includes(entry.name)) {
        const subDirResults = processDirectory(fullPath, scriptFileName);
        modifiedFiles.push(...subDirResults);
      } else {
        console.log(`Skipping excluded directory: ${entry.name}`);
      }
    } else if (entry.isFile() && /\.js$/.test(entry.name)) {
      const result = addUUIDsToFile(fullPath, scriptFileName);
      if (result) {
        modifiedFiles.push(result);
      }
    }
  }
  
  return modifiedFiles;
}

/**
 * Runs the UUID process
 * @param {string} scriptFileName Script filename to skip
 */
function runUUIDProcess(scriptFileName) {
  const modifiedFiles = processDirectory(process.cwd(), scriptFileName);
  
  // Update last run info
  configManager.updateLastRunInfo({
    timestamp: Date.now(),
    files: modifiedFiles
  });
  
  console.log(`Run completed. Modified ${modifiedFiles.length} files.`);
}

module.exports = {
  generateShortUUID,
  isInExcludedPath,
  addUUIDsToFile,
  processDirectory,
  runUUIDProcess
};