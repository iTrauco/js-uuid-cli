// lib/cli.js


const readline = require('readline');
const path = require('path');
const configManager = require('./config.js');
const fileProcessor = require('./file-processor');
const backupManager = require('./backup-manager');
console.log("Available fileProcessor functions:", Object.keys(fileProcessor));

/**
 * Shows the main menu
 */
function showMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const config = configManager.getConfig();
  
  console.log('\nUUID CLI Configuration:');
  console.log('1. Include Branch Name: ' + (config.includeBranch ? 'Yes' : 'No'));
  console.log('2. Include Last Commit: ' + (config.includeCommit ? 'Yes' : 'No'));
  console.log('3. Include Timestamp: ' + (config.includeTimestamp ? 'Yes' : 'No'));
  console.log('4. Include Line Numbers: ' + (config.includeLineNumber ? 'Yes' : 'No'));
  console.log('5. Manage Excluded Directories');
  console.log('6. Manage Target Files'); // New option
  console.log('7. Reset to Defaults');
  console.log('8. Save and Run');
  console.log('9. Rollback Last Run');
  console.log('10. Exit'); // Changed from 9 to 10
  
  rl.question('\nEnter option number: ', (answer) => {
    rl.close();
    handleMenuOption(answer);
  });
}

/**
 * Handles the main menu selection
 * @param {string} option Selected option
 */
function handleMenuOption(option) {
  const config = configManager.getConfig();
  
  switch(option) {
    case '1':
      config.includeBranch = !config.includeBranch;
      configManager.updateConfig(config);
      showMenu();
      break;
    case '2':
      config.includeCommit = !config.includeCommit;
      configManager.updateConfig(config);
      showMenu();
      break;
    case '3':
      config.includeTimestamp = !config.includeTimestamp;
      configManager.updateConfig(config);
      showMenu();
      break;
    case '4':
      config.includeLineNumber = !config.includeLineNumber;
      configManager.updateConfig(config);
      showMenu();
      break;
      case '5':
        showDirectoryMenu();
        break;
      case '6': // New case
        showTargetFilesMenu();
        break;
      case '7': // Changed from 6 to 7
        configManager.resetConfig();
        showMenu();
        break;
      case '8': // Changed from 7 to 8
        configManager.saveConfig();
        fileProcessor.runUUIDProcess(path.basename(process.argv[1]));
        break;
      case '9': // Changed from 8 to 9
        backupManager.rollbackLastRun();
        showMenu();
        break;
      case '10': // Changed from 9 to 10
        console.log('Exiting without changes.');
        break;
  }
}

/**
 * Shows the directory management menu
 */
function showDirectoryMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const config = configManager.getConfig();
  
  console.log('\nExcluded Directories Management:');
  console.log('Currently excluded:');
  
  if (!config.excludeDirs || config.excludeDirs.length === 0) {
    console.log('No directories excluded.');
  } else {
    config.excludeDirs.forEach((dir, index) => {
      console.log(`${index + 1}. ${dir}`);
    });
  }
  
  console.log('\nOptions:');
  console.log('1. Add directory to exclude');
  console.log('2. Remove directory from exclude list');
  console.log('3. Back to main menu');
  
  rl.question('\nEnter option number: ', (answer) => {
    rl.close();
    handleDirectoryMenuOption(answer);
  });
}

/**
 * Handles directory menu selection
 * @param {string} option Selected option
 */
function handleDirectoryMenuOption(option) {
  switch(option) {
    case '1':
      addExcludeDirectory();
      break;
    case '2':
      removeExcludeDirectory();
      break;
    case '3':
      showMenu();
      break;
    default:
      console.log('Invalid option. Please try again.');
      showDirectoryMenu();
  }
}

/**
 * Adds a directory to the exclude list
 */
function addExcludeDirectory() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter directory name to exclude: ', (dir) => {
    rl.close();
    
    if (dir && dir.trim()) {
      const trimmedDir = dir.trim();
      const config = configManager.getConfig();
      
      if (!config.excludeDirs.includes(trimmedDir)) {
        config.excludeDirs.push(trimmedDir);
        configManager.updateConfig(config);
        console.log(`Added "${trimmedDir}" to exclude list.`);
      } else {
        console.log(`"${trimmedDir}" is already in the exclude list.`);
      }
    }
    
    showDirectoryMenu();
  });
}

/**
 * Removes a directory from the exclude list
 */
function removeExcludeDirectory() {
  const config = configManager.getConfig();
  
  if (!config.excludeDirs || config.excludeDirs.length === 0) {
    console.log('No directories to remove.');
    showDirectoryMenu();
    return;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter number of directory to remove (or 0 to cancel): ', (input) => {
    rl.close();
    
    const index = parseInt(input, 10) - 1;
    
    if (index === -1) {
      // User entered 0, cancel
      showDirectoryMenu();
      return;
    }
    
    if (isNaN(index) || index < 0 || index >= config.excludeDirs.length) {
      console.log('Invalid number. Please try again.');
    } else {
      const removedDir = config.excludeDirs[index];
      const { SKIP_DIRS } = configManager.getConstants();
      
      // Don't allow removing built-in directories
      if (SKIP_DIRS.includes(removedDir)) {
        console.log(`Cannot remove built-in excluded directory "${removedDir}".`);
      } else {
        config.excludeDirs.splice(index, 1);
        configManager.updateConfig(config);
        console.log(`Removed "${removedDir}" from exclude list.`);
      }
    }
    
    showDirectoryMenu();
  });
}

/**
 * Processes command line arguments
 * @param {Array} args Command line arguments
 */
function processArgs(args) {
  if (args.length > 2) {
    if (args[2] === '--run') {
      fileProcessor.runUUIDProcess(args[1]);
    } else if (args[2] === '--rollback') {
      backupManager.rollbackLastRun();
    } else if (args[2] === '--exclude' && args.length > 3) {
      const config = configManager.getConfig();
      const dir = args[3].trim();
      
      if (dir && !config.excludeDirs.includes(dir)) {
        config.excludeDirs.push(dir);
        configManager.updateConfig(config);
        configManager.saveConfig();
        console.log(`Added "${dir}" to exclude list.`);
      } else {
        console.log(`"${dir}" is already in exclude list or invalid.`);
      }
    } else if (args[2] === '--add-target' && args.length > 3) {
      const config = configManager.getConfig();
      const file = args[3].trim();
      
      if (file && !config.targetFiles.includes(file)) {
        config.targetFiles.push(file);
        configManager.updateConfig(config);
        configManager.saveConfig();
        console.log(`Added "${file}" to target files list.`);
      } else {
        console.log(`"${file}" is already in target files list or invalid.`);
      }
    } else if (args[2] === '--list-targets') {
      const config = configManager.getConfig();
      console.log('Target files:');
      
      if (config.targetFiles && config.targetFiles.length > 0) {
        config.targetFiles.forEach(file => console.log(`- ${file}`));
      } else {
        console.log('No specific files targeted. All JS files will be processed.');
      }
    } else if (args[2] === '--list-exclude') {
      const config = configManager.getConfig();
      console.log('Excluded directories:');
      
      if (config.excludeDirs && config.excludeDirs.length > 0) {
        config.excludeDirs.forEach(dir => console.log(`- ${dir}`));
      } else {
        console.log('No directories excluded.');
      }
    } else {
      console.log('Unknown command. Available commands: --run, --rollback, --exclude <dir>, --list-exclude, --add-target <file>, --list-targets');
    }
    return true;
  }
  return false;
}


/**
 * Shows the target files management menu
 */
function showTargetFilesMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const config = configManager.getConfig();
  
  console.log('\nTarget Files Management:');
  console.log('Currently targeted files:');
  
  if (!config.targetFiles || config.targetFiles.length === 0) {
    console.log('No files specifically targeted. All JS files will be processed.');
  } else {
    config.targetFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
  }
  
  console.log('\nOptions:');
  console.log('1. Add file to target list');
  console.log('2. Remove file from target list');
  console.log('3. Back to main menu');
  
  rl.question('\nEnter option number: ', (answer) => {
    rl.close();
    handleTargetFilesMenuOption(answer);
  });
}

/**
 * Handles target files menu selection
 * @param {string} option Selected option
 */
function handleTargetFilesMenuOption(option) {
  switch(option) {
    case '1':
      addTargetFile();
      break;
    case '2':
      removeTargetFile();
      break;
    case '3':
      showMenu();
      break;
    default:
      console.log('Invalid option. Please try again.');
      showTargetFilesMenu();
  }
}

/**
 * Adds a file to the target list
 */
function addTargetFile() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter path to file (relative to project root): ', (filePath) => {
    rl.close();
    
    if (filePath && filePath.trim()) {
      const trimmedPath = filePath.trim();
      const config = configManager.getConfig();
      
      // Check if file exists
      const fullPath = path.join(process.cwd(), trimmedPath);
      if (!fs.existsSync(fullPath)) {
        console.log(`Warning: File "${trimmedPath}" does not exist or is not accessible.`);
        console.log('Adding to target list anyway...');
      }
      
      if (!config.targetFiles.includes(trimmedPath)) {
        config.targetFiles.push(trimmedPath);
        configManager.updateConfig(config);
        console.log(`Added "${trimmedPath}" to target files list.`);
      } else {
        console.log(`"${trimmedPath}" is already in the target files list.`);
      }
    }
    
    showTargetFilesMenu();
  });
}


/**
 * Removes a file from the target list
 */
function removeTargetFile() {
  const config = configManager.getConfig();
  
  if (!config.targetFiles || config.targetFiles.length === 0) {
    console.log('No target files to remove.');
    showTargetFilesMenu();
    return;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter number of file to remove (or 0 to cancel): ', (input) => {
    rl.close();
    
    const index = parseInt(input, 10) - 1;
    
    if (index === -1) {
      // User entered 0, cancel
      showTargetFilesMenu();
      return;
    }
    
    if (isNaN(index) || index < 0 || index >= config.targetFiles.length) {
      console.log('Invalid number. Please try again.');
    } else {
      const removedFile = config.targetFiles[index];
      config.targetFiles.splice(index, 1);
      configManager.updateConfig(config);
      console.log(`Removed "${removedFile}" from target files list.`);
    }
    
    showTargetFilesMenu();
  });
}

module.exports = {
  showMenu,
  processArgs,
  showTargetFilesMenu,
  handleTargetFilesMenuOption,
  addTargetFile,
  removeTargetFile
};