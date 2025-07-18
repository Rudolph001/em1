
#!/usr/bin/env python3
"""
EuroMillions Analysis App - Local Setup Script
Cross-platform Python version of run-local.bat
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

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

def check_command_exists(command):
    """Check if a command exists in PATH"""
    try:
        subprocess.run([command, '--version'], 
                      capture_output=True, 
                      check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def run_command(command, description, check_error=True):
    """Run a command and handle errors"""
    colored_print(f"\n{description}...", 'blue')
    
    try:
        if platform.system() == 'Windows':
            result = subprocess.run(command, shell=True, check=check_error)
        else:
            result = subprocess.run(command.split(), check=check_error)
        
        if result.returncode == 0:
            colored_print(f"✓ {description} completed successfully", 'green')
            return True
        else:
            colored_print(f"✗ {description} failed", 'red')
            return False
    except subprocess.CalledProcessError as e:
        colored_print(f"✗ {description} failed with error: {e}", 'red')
        return False

def main():
    colored_print("EuroMillions Analysis App - Local Setup (JSON Storage)", 'yellow')
    colored_print("=" * 58, 'yellow')
    
    # Check if Node.js is installed
    colored_print("\nChecking Node.js installation...", 'blue')
    if not check_command_exists('node'):
        colored_print("ERROR: Node.js is not installed or not in PATH", 'red')
        colored_print("Please install Node.js 18+ from https://nodejs.org", 'red')
        sys.exit(1)
    
    # Get Node.js version
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, 
                              text=True, 
                              check=True)
        colored_print(f"✓ Node.js version: {result.stdout.strip()}", 'green')
    except subprocess.CalledProcessError:
        colored_print("ERROR: Could not get Node.js version", 'red')
        sys.exit(1)
    
    # Check if package.json exists
    if not Path('package.json').exists():
        colored_print("ERROR: package.json not found", 'red')
        colored_print("Make sure you're in the correct directory", 'red')
        sys.exit(1)
    
    # Check if .env exists (now optional with JSON storage)
    if not Path('.env').exists():
        colored_print("Creating .env file for JSON storage mode...", 'blue')
        with open('.env', 'w') as f:
            f.write("NODE_ENV=development\n")
            f.write("STORAGE_TYPE=json\n")
        colored_print("✓ Using JSON file storage mode (no database required)", 'green')
    
    # Install dependencies
    if not run_command('npm install', 'Installing dependencies'):
        colored_print("ERROR: Failed to install dependencies", 'red')
        sys.exit(1)
    
    # Create data directory for JSON storage
    colored_print("\nSetting up JSON storage...", 'blue')
    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)
    colored_print("✓ JSON storage directory created", 'green')
    colored_print("✓ No database setup required - using JSON files", 'green')
    
    # Information about API tests
    colored_print("\nAPI tests will be available after the server starts", 'blue')
    colored_print("You can run 'python test-local.py' in another terminal to test the API", 'blue')
    colored_print("Or run 'python diagnose-local.py' for detailed diagnostics", 'blue')
    
    colored_print("\n" + "=" * 58, 'yellow')
    colored_print("Setup complete! Starting the application...", 'green')
    colored_print("", 'yellow')
    colored_print("Application will be available at: http://localhost:5000", 'green')
    colored_print("Press Ctrl+C to stop the server", 'yellow')
    colored_print("=" * 58, 'yellow')
    
    # Set environment variable and start the application
    env = os.environ.copy()
    env['NODE_ENV'] = 'development'
    
    try:
        # Start the application
        if platform.system() == 'Windows':
            subprocess.run('npx tsx server/index.ts', 
                         shell=True, 
                         env=env)
        else:
            subprocess.run(['npx', 'tsx', 'server/index.ts'], 
                         env=env)
    except KeyboardInterrupt:
        colored_print("\nShutting down gracefully...", 'yellow')
        colored_print("Server stopped", 'green')
    except Exception as e:
        colored_print(f"ERROR: Failed to start server: {e}", 'red')
        sys.exit(1)

if __name__ == "__main__":
    main()
