// lib/git-utils.js
const { execSync } = require('child_process');

/**
 * Gets Git information from the current repository
 * @returns {Object} Object containing branch and lastCommit information
 */
function getGitInfo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    let branch = null;
    
    // Method 1: Try symbolic-ref HEAD
    try {
      branch = execSync('git symbolic-ref --short HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
      console.log('Could not get branch via symbolic-ref:', e.message);
    }
    
    // Method 2: Try git status if still null
    if (!branch) {
      try {
        const gitStatusOutput = execSync('git status', { encoding: 'utf8' });
        const branchMatch = gitStatusOutput.match(/On branch ([^\s]+)/);
        if (branchMatch && branchMatch[1]) {
          branch = branchMatch[1];
        }
      } catch (e) {
        console.log('Could not get branch via git status:', e.message);
      }
    }
    
    // Method 3: Try environment variables if still null
    if (!branch) {
      if (process.env.BRANCH_NAME) {
        branch = process.env.BRANCH_NAME;
      } else if (process.env.GIT_BRANCH) {
        branch = process.env.GIT_BRANCH;
      }
    }
    
    // Method 4: Last attempt with show-current
    if (!branch) {
      try {
        branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      } catch (e) {
        console.log('Could not get branch via show-current:', e.message);
      }
    }
    
    // Get commit info
    const lastCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    
    console.log('Debug - Detected Git Info:', { branch, lastCommit });
    return { branch, lastCommit };
  } catch (error) {
    console.log('Git info detection error:', error.message);
    return { branch: null, lastCommit: null };
  }
}

module.exports = {
  getGitInfo
};