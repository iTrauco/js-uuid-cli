// lib/backup-manager.js
const fs = require('fs');
const path = require('path');
const configManager = require('./config.js');

/**
 * Ensures backup directory exists
 */
function ensureBackupDir() {
  const { BACKUP_DIR } = configManager.getConstants();
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Creates a backup of a file
 * @param {string} filePath Path to the file
 * @returns {Object|null} Backup information or null if backup failed
 */
function backupFile(filePath) {
  try {
    const { BACKUP_DIR } = configManager.getConstants();
    ensureBackupDir();
    
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const backupPath = path.join(BACKUP_DIR, `${fileName}.${Date.now()}.bak`);
    
    fs.writeFileSync(backupPath, content);
    return { relativePath, backupPath };
  } catch (error) {
    console.error(`Error backing up ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Rolls back the last run
 */
function rollbackLastRun() {
  const lastRunInfo = configManager.getLastRunInfo();
  
  if (!lastRunInfo.timestamp || lastRunInfo.files.length === 0) {
    console.log('No previous run found to rollback.');
    return;
  }
  
  console.log(`Rolling back run from ${new Date(lastRunInfo.timestamp).toLocaleString()}`);
  console.log(`Files to restore: ${lastRunInfo.files.length}`);
  
  let successCount = 0;
  
  for (const file of lastRunInfo.files) {
    try {
      if (fs.existsSync(file.backupPath)) {
        const backupContent = fs.readFileSync(file.backupPath, 'utf8');
        const targetPath = path.join(process.cwd(), file.relativePath);
        
        fs.writeFileSync(targetPath, backupContent);
        console.log(`Restored: ${file.relativePath}`);
        successCount++;
      } else {
        console.error(`Backup not found: ${file.backupPath}`);
      }
    } catch (error) {
      console.error(`Error restoring ${file.relativePath}: ${error.message}`);
    }
  }
  
  console.log(`Rollback completed. Restored ${successCount} of ${lastRunInfo.files.length} files.`);
  
  // Clear the last run info
  configManager.updateLastRunInfo({
    timestamp: null,
    files: []
  });
}

module.exports = {
  ensureBackupDir,
  backupFile,
  rollbackLastRun
};