#!/bin/bash

# Cabinet Project Setup Script
# Run this to set up the complete Cabinet project

set -e

echo "🚀 Cabinet Project Setup"
echo "========================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create environment file
echo ""
echo "⚙️ Setting up environment..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "📝 Created .env.local - Please edit with your database URL"
    echo "   Important: Set DATABASE_URL to your PostgreSQL connection"
    echo "   Example: postgres://user:password@localhost:5432/cabinet"
else
    echo "✅ .env.local already exists"
fi

# Check PostgreSQL
echo ""
echo "🗄️ Checking PostgreSQL connection..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set in environment"
    echo "   Set it before running migrations:"
    echo "   export DATABASE_URL='postgres://user:password@localhost:5432/cabinet'"
fi

# Setup database
echo ""
echo "🔧 Setting up database..."
echo "   Run these commands when ready:"
echo "   npm run db:generate  # Generate migrations"
echo "   npm run db:push      # Apply migrations"

# Show next steps
echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Edit .env.local with your database connection"
echo "   2. Create database: createdb cabinet"
echo "   3. Run migrations: npm run db:generate && npm run db:push"
echo "   4. Start dev server: npm run dev"
echo "   5. Visit http://localhost:3000"
echo ""
echo "🔐 Default Demo Credentials:"
echo "   Username: doctor"
echo "   Password: password123"
echo ""
echo "📚 Documentation: See ARCHITECTURE.md for detailed information"
echo ""
