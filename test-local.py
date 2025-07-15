
#!/usr/bin/env python3
"""
Test script for local EuroMillions database
Python version of test-local.js
"""

import json
import urllib.request
import urllib.error
from datetime import datetime
import sys

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

def make_request(url, timeout=10):
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
        return {
            'status': 0,
            'success': False,
            'data': None,
            'error': f'Connection error: {e.reason}'
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
            'error': f'Unexpected error: {e}'
        }

def run_test(test_name, url, expected_keys=None):
    """Run a single test"""
    colored_print(f"\nTesting {test_name}...", 'blue')
    
    response = make_request(url)
    
    if not response['success']:
        colored_print(f"❌ {test_name} failed", 'red')
        colored_print(f"   Status: {response['status']}", 'red')
        colored_print(f"   Error: {response['error']}", 'red')
        return False
    
    # Check expected keys if provided
    if expected_keys and response['data']:
        missing_keys = [key for key in expected_keys if key not in response['data']]
        if missing_keys:
            colored_print(f"❌ {test_name} failed - missing keys: {missing_keys}", 'red')
            return False
    
    colored_print(f"✅ {test_name} passed", 'green')
    return True

def main():
    colored_print("🧪 EuroMillions Local API Test Suite", 'blue')
    colored_print("=" * 50, 'blue')
    
    tests = [
        ("Server Health", f"{BASE_URL}/api/stats", ['totalCombinations', 'drawnCombinations']),
        ("Draw History", f"{BASE_URL}/api/history", None),
        ("Current Jackpot", f"{BASE_URL}/api/jackpot", ['amountEur', 'amountZar']),
        ("Next Draw Info", f"{BASE_URL}/api/next-draw", ['nextDrawDate', 'timeUntilDraw']),
        ("Number Analytics", f"{BASE_URL}/api/analytics/numbers", ['hotNumbers', 'coldNumbers']),
        ("Star Analytics", f"{BASE_URL}/api/analytics/stars", ['hotStars', 'coldStars']),
        ("Predictions", f"{BASE_URL}/api/predictions", None),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, url, expected_keys in tests:
        if run_test(test_name, url, expected_keys):
            passed += 1
        else:
            failed += 1
    
    # Summary
    colored_print("\n" + "=" * 50, 'blue')
    colored_print("Test Results:", 'blue')
    colored_print(f"✅ Passed: {passed}", 'green')
    colored_print(f"❌ Failed: {failed}", 'red')
    
    if failed == 0:
        colored_print("🎉 All tests passed!", 'green')
        colored_print("Your EuroMillions app is working correctly!", 'green')
    else:
        colored_print("⚠️  Some tests failed. Check the errors above.", 'yellow')
        colored_print("Make sure the server is running with 'python run-local.py'", 'yellow')
    
    colored_print("=" * 50, 'blue')
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
