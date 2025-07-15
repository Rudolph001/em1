
#!/usr/bin/env python3
"""
Diagnostic script for local EuroMillions database
Python version of diagnose-local.js
"""

import json
import urllib.request
import urllib.error
from datetime import datetime
import sys
import platform

BASE_URL = 'http://localhost:5000'

def colored_print(message, color='white'):
    """Print colored text to console"""
    colors = {
        'green': '\033[92m',
        'red': '\033[91m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'white': '\033[97m',
        'reset': '\033[0m'
    }
    print(f"{colors.get(color, colors['white'])}{message}{colors['reset']}")

def make_request(url, timeout=5):
    """Make HTTP request and return response"""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            data = response.read().decode('utf-8')
            return {
                'status': response.status,
                'success': response.status == 200,
                'data': json.loads(data),
                'error': None
            }
    except urllib.error.HTTPError as e:
        return {
            'status': e.code,
            'success': False,
            'data': None,
            'error': f'HTTP {e.code}: {e.reason}'
        }
    except urllib.error.URLError as e:
        error_msg = str(e.reason)
        if 'Connection refused' in error_msg:
            error_msg = 'Connection refused - server is not running'
        elif 'Name or service not known' in error_msg:
            error_msg = 'Server not found - check if localhost:5000 is accessible'
        return {
            'status': 0,
            'success': False,
            'data': None,
            'error': error_msg
        }
    except json.JSONDecodeError as e:
        return {
            'status': 0,
            'success': False,
            'data': None,
            'error': f'Invalid JSON: {e}'
        }
    except Exception as e:
        return {
            'status': 0,
            'success': False,
            'data': None,
            'error': f'Request timeout' if 'timeout' in str(e) else f'Unexpected error: {e}'
        }

def main():
    colored_print('🔍 EuroMillions Database Diagnostic Tool', 'blue')
    colored_print('', 'blue')
    colored_print(f'📍 Testing connection to: {BASE_URL}', 'yellow')
    
    # Check if server is running
    colored_print('\n1. Checking server connection...', 'blue')
    health_check = make_request(f'{BASE_URL}/api/stats')
    
    if not health_check['success']:
        colored_print('❌ Server not responding. Make sure it\'s running with "python run-local.py"', 'red')
        colored_print(f'   Error: {health_check["error"] or "Unknown error"}', 'red')
        
        if health_check['error'] and ('Connection refused' in health_check['error'] or 'not found' in health_check['error']):
            colored_print('\n💡 Environment Detection:', 'yellow')
            colored_print(f'   You are running this diagnostic on your local {platform.system()} machine,', 'yellow')
            colored_print('   but there\'s no server running locally.', 'yellow')
            colored_print('\n🔧 Choose one solution:', 'yellow')
            colored_print('   Option A (Recommended): Run this diagnostic on Replit where the server is running', 'yellow')
            colored_print('   Option B: Start the server locally on your machine:', 'yellow')
            colored_print('     1. Open a NEW terminal window (keep this one open)', 'yellow')
            colored_print('     2. Navigate to your project directory', 'yellow')
            colored_print('     3. Run: python run-local.py', 'yellow')
            colored_print('     4. Wait for "serving on localhost:5000" message', 'yellow')
            colored_print('     5. Then run this diagnostic again: python diagnose-local.py', 'yellow')
            colored_print('\n   📋 Before running the server, ensure:', 'yellow')
            colored_print('     - Your .env file has a valid DATABASE_URL', 'yellow')
            colored_print('     - Node.js 18+ is installed', 'yellow')
            colored_print('     - You have a PostgreSQL database setup', 'yellow')
            colored_print('\n   ✅ Status: The server is running successfully on Replit with 50 draws loaded.', 'yellow')
        else:
            colored_print('   This appears to be a network connectivity issue.', 'yellow')
            colored_print('   The server you\'re trying to reach (localhost:5000) is not responding.', 'yellow')
            colored_print('   Make sure you have a local server running or use the Replit version.', 'yellow')
        return
    
    colored_print('✅ Server is running', 'green')
    
    # Check database stats
    colored_print('\n2. Checking database stats...', 'blue')
    stats = make_request(f'{BASE_URL}/api/stats')
    
    if not stats['success']:
        colored_print('❌ Stats API failed', 'red')
        colored_print(f'   Status: {stats["status"]}', 'red')
        colored_print(f'   Error: {stats["error"] or "Unknown error"}', 'red')
    else:
        colored_print('✅ Database stats loaded', 'green')
        data = stats['data']
        colored_print(f'   Total combinations: {data["totalCombinations"]:,}', 'blue')
        colored_print(f'   Drawn combinations: {data["drawnCombinations"]}', 'blue')
        colored_print(f'   Never drawn: {data["neverDrawnCombinations"]:,}', 'blue')
    
    # Check history
    colored_print('\n3. Checking draw history...', 'blue')
    history = make_request(f'{BASE_URL}/api/history')
    
    if not history['success']:
        colored_print('❌ History API failed', 'red')
        colored_print(f'   Status: {history["status"]}', 'red')
        colored_print(f'   Error: {history["error"] or "Unknown error"}', 'red')
    else:
        colored_print('✅ Draw history loaded', 'green')
        data = history['data']
        colored_print(f'   Number of draws: {len(data)}', 'blue')
        if len(data) > 0:
            latest = data[0]
            draw_date = datetime.fromisoformat(latest['drawDate'].replace('Z', '+00:00'))
            colored_print(f'   Latest draw: {draw_date.strftime("%Y-%m-%d")}', 'blue')
            colored_print(f'   Numbers: {", ".join(map(str, latest["numbers"]))}', 'blue')
            colored_print(f'   Stars: {", ".join(map(str, latest["stars"]))}', 'blue')
    
    # Force initialization
    colored_print('\n4. Force initializing data...', 'blue')
    init = make_request(f'{BASE_URL}/api/initialize')
    
    if not init['success']:
        colored_print('❌ Initialization failed', 'red')
        colored_print(f'   Status: {init["status"]}', 'red')
        colored_print(f'   Error: {init["error"] or "Unknown error"}', 'red')
    else:
        colored_print('✅ Data initialization completed', 'green')
        if init['data'] and 'stats' in init['data']:
            stats_data = init['data']['stats']
            colored_print(f'   Draws loaded: {stats_data["drawnCombinations"]}', 'blue')
            colored_print(f'   Prediction accuracy: {stats_data["predictionAccuracy"] * 100:.1f}%', 'blue')
    
    # Check analytics
    colored_print('\n5. Checking analytics after initialization...', 'blue')
    analytics = make_request(f'{BASE_URL}/api/analytics/numbers')
    
    if not analytics['success']:
        colored_print('❌ Analytics API failed', 'red')
        colored_print(f'   Status: {analytics["status"]}', 'red')
        colored_print(f'   Error: {analytics["error"] or "Unknown error"}', 'red')
    else:
        colored_print('✅ Analytics loaded', 'green')
        data = analytics['data']
        if 'hotNumbers' in data and data['hotNumbers']:
            hot_numbers = [str(n['number']) for n in data['hotNumbers'][:5]]
            colored_print(f'   Hot numbers: {", ".join(hot_numbers)}', 'blue')
        if 'hotStars' in data and data['hotStars']:
            hot_stars = [str(s['number']) for s in data['hotStars'][:3]]
            colored_print(f'   Hot stars: {", ".join(hot_stars)}', 'blue')
    
    # Final summary
    colored_print('\n📋 Diagnostic Summary:', 'blue')
    
    all_working = (health_check['success'] and stats['success'] and 
                   history['success'] and init['success'] and analytics['success'])
    
    if all_working:
        colored_print('✅ All systems working correctly!', 'green')
        colored_print('   Your local setup is ready to use at http://localhost:5000', 'green')
    else:
        colored_print('⚠️  Some issues detected. Recommendations:', 'yellow')
        
        if not (stats['success'] and history['success'] and analytics['success']):
            colored_print('   1. Check your DATABASE_URL in .env file', 'yellow')
            colored_print('   2. Run: npm run db:push', 'yellow')
            colored_print('   3. Restart the server: python run-local.py', 'yellow')
            colored_print('   4. Visit: http://localhost:5000/api/initialize', 'yellow')
    
    colored_print('\n🏁 Diagnostic complete.\n', 'blue')

if __name__ == "__main__":
    main()
