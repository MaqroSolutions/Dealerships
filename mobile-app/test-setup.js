#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Dealership Sales Mobile App Setup...');
console.log('==============================================');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.log('❌ package.json not found. Please run this script from the mobile-app directory.');
  process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('❌ node_modules not found. Please run "npm install" first.');
  process.exit(1);
}

// Check if src directory exists
if (!fs.existsSync('src')) {
  console.log('❌ src directory not found. Please check the project structure.');
  process.exit(1);
}

// Check required directories
const requiredDirs = ['src/screens', 'src/context', 'src/services', 'src/types'];
const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));

if (missingDirs.length > 0) {
  console.log(`❌ Missing required directories: ${missingDirs.join(', ')}`);
  process.exit(1);
}

// Check required files
const requiredFiles = [
  'App.tsx',
  'src/screens/LoginScreen.tsx',
  'src/screens/ConversationsScreen.tsx',
  'src/screens/PendingApprovalsScreen.tsx',
  'src/screens/ProfileScreen.tsx',
  'src/screens/ConversationDetailScreen.tsx',
  'src/context/AuthContext.tsx',
  'src/context/NotificationContext.tsx',
  'src/services/apiClient.ts',
  'src/types/navigation.ts'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.log(`❌ Missing required files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// Check package.json dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'expo',
  'react',
  'react-native',
  '@react-navigation/native',
  'react-native-paper',
  'axios'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log(`❌ Missing required dependencies: ${missingDeps.join(', ')}`);
  console.log('   Please run "npm install" to install all dependencies.');
  process.exit(1);
}

// Check if setup.sh exists and is executable
if (!fs.existsSync('setup.sh')) {
  console.log('⚠️  setup.sh not found. Setup script may not work properly.');
} else {
  try {
    fs.accessSync('setup.sh', fs.constants.X_OK);
    console.log('✅ setup.sh is executable');
  } catch (error) {
    console.log('⚠️  setup.sh is not executable. Run "chmod +x setup.sh" to fix.');
  }
}

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('⚠️  .env file not found. You may need to create one with your API configuration.');
} else {
  console.log('✅ .env file exists');
}

console.log('');
console.log('🎉 All tests passed! Your mobile app setup looks good.');
console.log('');
console.log('📱 Next steps:');
console.log('1. Update API_BASE_URL in src/services/apiClient.ts');
console.log('2. Run "npm start" to start the development server');
console.log('3. Install Expo Go on your mobile device');
console.log('4. Scan the QR code to run the app');
console.log('');
console.log('🔧 For more help, check README.md or run "./setup.sh"');
console.log('');
console.log('Happy coding! 🚗📱');
