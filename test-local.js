#!/usr/bin/env node

/**
 * Local Machine Test Script for EuroMillions Analysis App
 * Run with: node test-local.js
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 EuroMillions App - Local Machine Test\n');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TESTS = [
  { name: 'Health Check', url: '/', expectsHTML: true },
  { name: 'Force Initialize', url: '/api/initialize', expectsJSON: true },
  { name: 'Stats API', url: '/api/stats', expectsJSON: true },
  { name: 'History API', url: '/api/history', expectsJSON: true },
  { name: 'Jackpot API', url: '/api/jackpot', expectsJSON: true },
  { name: 'Next Draw API', url: '/api/next-draw', expectsJSON: true },
  { name: 'Analytics API', url: '/api/analytics/numbers', expectsJSON: true }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Test HTTP request
function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = BASE_URL + test.url;
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === 200;
        const result = {
          name: test.name,
          url: url,
          status: res.statusCode,
          success: success,
          data: data,
          contentType: res.headers['content-type']
        };
        
        if (success && test.expectsJSON) {
          try {
            result.json = JSON.parse(data);
          } catch (e) {
            result.success = false;
            result.error = 'Invalid JSON response';
          }
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: test.name,
        url: url,
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: test.name,
        url: url,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

// Check if files exist
function checkFiles() {
  log('📁 Checking project files...', 'blue');
  
  const requiredFiles = [
    'package.json',
    'server/index.ts',
    'client/src/App.tsx',
    'shared/schema.ts',
    '.env'
  ];
  
  const missing = [];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file}`, 'red');
      missing.push(file);
    }
  });
  
  if (missing.length > 0) {
    log(`\n⚠️  Missing files: ${missing.join(', ')}`, 'yellow');
    return false;
  }
  
  return true;
}

// Check environment variables
function checkEnvironment() {
  log('\n🔧 Checking environment...', 'blue');
  
  if (!fs.existsSync('.env')) {
    log('❌ .env file not found', 'red');
    return false;
  }
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const hasDbUrl = envContent.includes('DATABASE_URL');
  
  if (hasDbUrl) {
    log('✅ DATABASE_URL configured', 'green');
  } else {
    log('❌ DATABASE_URL not found in .env', 'red');
    return false;
  }
  
  return true;
}

// Validate API responses
function validateResponse(result) {
  if (!result.success) {
    return false;
  }
  
  switch (result.name) {
    case 'Stats API':
      return result.json && 
             typeof result.json.totalCombinations === 'number' &&
             typeof result.json.drawnCombinations === 'number';
             
    case 'History API':
      return Array.isArray(result.json) && result.json.length > 0;
      
    case 'Jackpot API':
      return result.json && 
             typeof result.json.amountEur === 'number' &&
             typeof result.json.amountZar === 'number';
             
    case 'Next Draw API':
      return result.json && result.json.nextDrawDate;
      
    case 'Analytics API':
      return result.json && 
             Array.isArray(result.json.hotNumbers) &&
             Array.isArray(result.json.coldNumbers);
             
    default:
      return true;
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting EuroMillions App Tests\n', 'blue');
  
  // Pre-flight checks
  if (!checkFiles() || !checkEnvironment()) {
    log('\n❌ Pre-flight checks failed. Please fix the issues above.', 'red');
    process.exit(1);
  }
  
  log('\n🌐 Testing API endpoints...', 'blue');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of TESTS) {
    process.stdout.write(`Testing ${test.name}... `);
    
    const result = await testEndpoint(test);
    results.push(result);
    
    if (result.success && validateResponse(result)) {
      log('✅ PASS', 'green');
      passed++;
    } else {
      log('❌ FAIL', 'red');
      if (result.error) {
        log(`   Error: ${result.error}`, 'red');
      } else if (result.status !== 200) {
        log(`   Status: ${result.status}`, 'red');
      }
      failed++;
    }
  }
  
  // Summary
  log('\n📊 Test Results:', 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  // Detailed results for passing tests
  log('\n📋 Detailed Results:', 'blue');
  results.forEach(result => {
    if (result.success && result.json) {
      switch (result.name) {
        case 'Force Initialize':
          if (result.json.stats) {
            log(`🔄 Initialization complete: ${result.json.stats.drawnCombinations} draws loaded`);
          }
          break;
        case 'Stats API':
          log(`📈 ${result.json.drawnCombinations} draws out of ${result.json.totalCombinations.toLocaleString()} combinations`);
          break;
        case 'History API':
          log(`📅 ${result.json.length} historical draws loaded`);
          if (result.json[0]) {
            log(`   Latest: ${new Date(result.json[0].drawDate).toDateString()}`);
          }
          break;
        case 'Jackpot API':
          log(`💰 Jackpot: €${result.json.amountEur.toLocaleString()} (R${Math.round(result.json.amountZar).toLocaleString()})`);
          break;
        case 'Next Draw API':
          log(`⏰ Next draw: ${new Date(result.json.nextDrawDate).toLocaleString()}`);
          break;
      }
    }
  });
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Your local setup is working correctly.', 'green');
    log('\n🌟 Open http://localhost:5000 in your browser to use the app.', 'blue');
  } else {
    log('\n⚠️  Some tests failed. Check the server logs and fix the issues.', 'yellow');
  }
  
  log('\n💡 Tip: Make sure the server is running with "npm run dev"', 'blue');
}

// Run the tests
runTests().catch(console.error);