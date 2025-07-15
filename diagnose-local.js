
/**
 * Diagnostic script for local EuroMillions database
 * Run with: node diagnose-local.js
 */

import http from 'http';
const BASE_URL = 'http://localhost:5000';

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

async function makeRequest(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode === 200,
            data: json,
            error: null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            success: false,
            data: data,
            error: 'Invalid JSON: ' + e.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      let errorMessage = error.message;
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - server is not running';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Server not found - check if localhost:5000 is accessible';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout - server may be starting up';
      }
      
      resolve({
        status: 0,
        success: false,
        data: null,
        error: errorMessage,
        code: error.code
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        success: false,
        data: null,
        error: 'Request timeout'
      });
    });
  });
}

async function diagnose() {
  log('🔍 EuroMillions Database Diagnostic Tool\n', 'blue');
  log('📍 Testing connection to: ' + BASE_URL, 'yellow');
  
  // Check if server is running by testing stats endpoint
  log('\n1. Checking server connection...', 'blue');
  const healthCheck = await makeRequest(BASE_URL + '/api/stats');
  
  if (!healthCheck.success) {
    log('❌ Server not responding. Make sure it\'s running with "npm run dev"', 'red');
    log('   Error: ' + (healthCheck.error || 'Unknown error'), 'red');
    
    if (healthCheck.error && healthCheck.error.includes('Connection refused')) {
      log('\n💡 Environment Detection:', 'yellow');
      log('   You are running this diagnostic on your local Windows machine,', 'yellow');
      log('   but the server is running on Replit.', 'yellow');
      log('\n🔧 Choose one solution:', 'yellow');
      log('   Option A: Run this diagnostic on Replit where the server is running', 'yellow');
      log('   Option B: Start the server locally:', 'yellow');
      log('     1. Open a new terminal window', 'yellow');
      log('     2. Run: run-local.bat', 'yellow');
      log('     3. Wait for "serving on localhost:5000" message', 'yellow');
      log('     4. Then run this diagnostic again', 'yellow');
    } else if (healthCheck.data && typeof healthCheck.data === 'string' && healthCheck.data.includes('<!DOCTYPE')) {
      log('   Note: Server returned HTML instead of JSON - check if API endpoints are working', 'yellow');
    }
    return;
  }
  
  log('✅ Server is running', 'green');
  
  // Check database stats
  log('\n2. Checking database stats...', 'blue');
  const stats = await makeRequest(BASE_URL + '/api/stats');
  
  if (!stats.success) {
    log('❌ Stats API failed', 'red');
    log('   Status: ' + stats.status, 'red');
    log('   Error: ' + (stats.error || 'Unknown error'), 'red');
    log('   Response: ' + JSON.stringify(stats.data, null, 2), 'yellow');
  } else {
    log('✅ Database stats loaded', 'green');
    log('   Total combinations: ' + stats.data.totalCombinations.toLocaleString(), 'blue');
    log('   Drawn combinations: ' + stats.data.drawnCombinations, 'blue');
    log('   Never drawn: ' + stats.data.neverDrawnCombinations.toLocaleString(), 'blue');
  }
  
  // Check history
  log('\n3. Checking draw history...', 'blue');
  const history = await makeRequest(BASE_URL + '/api/history');
  
  if (!history.success) {
    log('❌ History API failed', 'red');
    log('   Status: ' + history.status, 'red');
    log('   Error: ' + (history.error || 'Unknown error'), 'red');
    log('   Response: ' + JSON.stringify(history.data, null, 2), 'yellow');
  } else {
    log('✅ Draw history loaded', 'green');
    log('   Number of draws: ' + history.data.length, 'blue');
    if (history.data.length > 0) {
      log('   Latest draw: ' + new Date(history.data[0].drawDate).toLocaleDateString(), 'blue');
      log('   Numbers: ' + history.data[0].numbers.join(', '), 'blue');
      log('   Stars: ' + history.data[0].stars.join(', '), 'blue');
    }
  }
  
  // Force initialization
  log('\n4. Force initializing data...', 'blue');
  const init = await makeRequest(BASE_URL + '/api/initialize');
  
  if (!init.success) {
    log('❌ Initialization failed', 'red');
    log('   Status: ' + init.status, 'red');
    log('   Error: ' + (init.error || 'Unknown error'), 'red');
    log('   Response: ' + JSON.stringify(init.data, null, 2), 'yellow');
  } else {
    log('✅ Data initialization completed', 'green');
    if (init.data.stats) {
      log('   Draws loaded: ' + init.data.stats.drawnCombinations, 'blue');
      log('   Prediction accuracy: ' + (init.data.stats.predictionAccuracy * 100).toFixed(1) + '%', 'blue');
    }
  }
  
  // Check analytics after initialization
  log('\n5. Checking analytics after initialization...', 'blue');
  const analytics = await makeRequest(BASE_URL + '/api/analytics/numbers');
  
  if (!analytics.success) {
    log('❌ Analytics API failed', 'red');
    log('   Status: ' + analytics.status, 'red');
    log('   Error: ' + (analytics.error || 'Unknown error'), 'red');
    log('   Response: ' + JSON.stringify(analytics.data, null, 2), 'yellow');
  } else {
    log('✅ Analytics loaded', 'green');
    if (analytics.data.hotNumbers) {
      log('   Hot numbers: ' + analytics.data.hotNumbers.slice(0, 5).map(n => n.number).join(', '), 'blue');
    }
    if (analytics.data.hotStars) {
      log('   Hot stars: ' + analytics.data.hotStars.slice(0, 3).map(s => s.number).join(', '), 'blue');
    }
  }
  
  // Final recommendation
  log('\n📋 Diagnostic Summary:', 'blue');
  
  const allWorking = healthCheck.success && stats.success && history.success && init.success && analytics.success;
  
  if (allWorking) {
    log('✅ All systems working correctly!', 'green');
    log('   Your local setup is ready to use at http://localhost:5000', 'green');
  } else {
    log('⚠️  Some issues detected. Recommendations:', 'yellow');
    
    if (!stats.success || !history.success || !analytics.success) {
      log('   1. Check your DATABASE_URL in .env file', 'yellow');
      log('   2. Run: npm run db:push', 'yellow');
      log('   3. Restart the server: npm run dev', 'yellow');
      log('   4. Visit: http://localhost:5000/api/initialize', 'yellow');
    }
  }
  
  log('\n🏁 Diagnostic complete.\n', 'blue');
}

// Run the diagnostic
diagnose().catch(console.error);
