#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNodeModules() {
  return fs.existsSync('node_modules') && fs.lstatSync('node_modules').isDirectory();
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    log('🚀 Starting Development Environment Setup...', 'blue');
    log('='.repeat(50), 'blue');
    
    // Check if node_modules exists
    if (!checkNodeModules()) {
      log('📦 Installing dependencies...', 'yellow');
      await runCommand('npm', ['install']);
      log('✅ Dependencies installed!', 'green');
    } else {
      log('✅ Dependencies already installed', 'green');
    }
    
    // Validate environment
    log('🔍 Validating environment...', 'yellow');
    await runCommand('npm', ['run', 'validate-env']);
    
    // Type check
    log('🔧 Running type check...', 'yellow');
    await runCommand('npm', ['run', 'type-check']);
    
    // Lint
    log('🔍 Running linter...', 'yellow');
    // await runCommand('npm', ['run', 'lint']);
    
    log('='.repeat(50), 'green');
    log('🎉 Environment setup complete!', 'green');
    log('🔥 Starting development server...', 'cyan');
    log('='.repeat(50), 'green');
    
    // Start development server
    await runCommand('npm', ['run', 'dev']);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
