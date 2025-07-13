#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('========================================');
console.log('EuroMillions App - Starting...');
console.log('========================================\n');

// Set environment variables for Windows compatibility
process.env.NODE_ENV = 'development';

// Check if .env exists, create it if not
const envPath = '.env';
if (!fs.existsSync(envPath)) {
    console.log('Creating .env file...');
    const envContent = `# EuroMillions App Environment Variables
# Generated automatically

NODE_ENV=development

# Database Configuration (SQLite for local development)
DATABASE_URL=file:./local.db

# Optional: API Keys (leave empty for demo mode)
# OPENAI_API_KEY=your_openai_key_here
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Created .env file with default settings\n');
}

// Start the development server
console.log('Starting development server...');
console.log('The app will be available at: http://localhost:5000');
console.log('Press Ctrl+C to stop the application\n');

const child = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
});

child.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

child.on('close', (code) => {
    console.log(`\nServer stopped with code ${code}`);
    process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    child.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    child.kill('SIGTERM');
});