#!/bin/bash

echo "🚗 Setting up Dealership Sales Mobile App..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📱 Installing Expo CLI..."
    npm install -g @expo/cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Expo CLI. Please try manually: npm install -g @expo/cli"
        exit 1
    fi
fi

echo "✅ Expo CLI installed"

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check the error above and try again."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOL
# Mobile App Configuration
API_BASE_URL=http://localhost:8000
EXPO_DEBUG=true
EOL
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if backend is running
echo "🔍 Checking if backend is accessible..."
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "⚠️  Backend is not accessible at http://localhost:8000"
    echo "   Please make sure your backend is running and update the API_BASE_URL in .env if needed"
fi

echo ""
echo "🎉 Setup complete! You can now run the mobile app:"
echo ""
echo "1. Start the development server:"
echo "   npm start"
echo ""
echo "2. Install Expo Go on your mobile device:"
echo "   - iOS: https://apps.apple.com/app/expo-go/id982107779"
echo "   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent"
echo ""
echo "3. Scan the QR code with Expo Go to run the app on your device"
echo ""
echo "📱 Demo credentials:"
echo "   Email: demo@dealership.com"
echo "   Password: password123"
echo ""
echo "🔧 To customize the app:"
echo "   - Update API_BASE_URL in src/services/apiClient.ts"
echo "   - Modify app.json for app configuration"
echo "   - Check README.md for detailed documentation"
echo ""
echo "Happy coding! 🚗📱"
