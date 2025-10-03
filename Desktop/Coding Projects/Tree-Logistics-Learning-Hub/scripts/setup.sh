#!/bin/bash

# Tree Learning Hub - Quick Setup Script
# This script helps set up the development environment

set -e

echo "🌳 Tree Learning Hub - Setup Script"
echo "===================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env with your configuration before proceeding"
    echo ""
    read -p "Press enter when you've configured .env file..."
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Ask about database setup
echo "🗄️  Database Setup"
read -p "Do you want to push the schema to the database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing schema to database..."
    npx prisma db push
    echo "✅ Database schema created"
    echo ""
    
    read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Seeding database..."
        npm run db:seed
        echo "✅ Database seeded"
        echo ""
    fi
fi

# Summary
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Make sure your .env file is properly configured"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "👤 Default Login Credentials (from seed):"
echo "   Admin:     admin@treelogistics.com / Admin123!"
echo "   Inspector: inspector@treelogistics.com / Inspector123!"
echo "   Driver:    driver1@example.com / Driver123!"
echo ""
echo "⚠️  IMPORTANT: Change these passwords in production!"
echo ""
echo "📚 For more information, see README.md and DEPLOYMENT.md"
echo ""
echo "Happy coding! 🚀"

