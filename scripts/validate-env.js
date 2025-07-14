#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.resolve(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.resolve(projectRoot, dirPath);
  if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    return false;
  }
}

log('🔍 Validating Development Environment...', 'blue');
log('='.repeat(50), 'blue');

let allPassed = true;

// Check essential files
allPassed &= checkFile('package.json', 'Package.json exists');
allPassed &= checkFile('vite.config.ts', 'Vite configuration exists');
allPassed &= checkFile('tailwind.config.js', 'Tailwind CSS configuration exists');
allPassed &= checkFile('postcss.config.js', 'PostCSS configuration exists');
allPassed &= checkFile('tsconfig.json', 'TypeScript configuration exists');
allPassed &= checkFile('tsconfig.app.json', 'TypeScript app configuration exists');
allPassed &= checkFile('eslint.config.js', 'ESLint configuration exists');
allPassed &= checkFile('index.html', 'HTML entry point exists');

// Check directories
allPassed &= checkDirectory('src', 'Source directory exists');
allPassed &= checkDirectory('src/components', 'Components directory exists');
allPassed &= checkDirectory('src/components/ui', 'UI components directory exists');
allPassed &= checkDirectory('src/lib', 'Library directory exists');

// Check key source files
allPassed &= checkFile('src/main.tsx', 'Main React entry point exists');
allPassed &= checkFile('src/App.tsx', 'Main App component exists');
allPassed &= checkFile('src/index.css', 'Main CSS file exists');
allPassed &= checkFile('src/lib/utils.ts', 'Utility functions exist');

log('\n' + '='.repeat(50), 'blue');

if (allPassed) {
  log('🎉 All environment checks passed!', 'green');
  log('Your development environment is ready to go!', 'green');
} else {
  log('❌ Some environment checks failed!', 'red');
  log('Please fix the missing files/directories before continuing.', 'yellow');
}

log('='.repeat(50), 'blue');
