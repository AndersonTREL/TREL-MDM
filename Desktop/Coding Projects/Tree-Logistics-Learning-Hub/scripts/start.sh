#!/bin/bash

echo "🚀 Starting Tree Learning Hub..."
echo ""

# Push database schema
echo "📊 Setting up database schema..."
npx prisma db push --accept-data-loss

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed

# Start dev server
echo "🎉 Starting development server..."
echo ""
echo "✅ Server will start at: http://localhost:3000"
echo ""
echo "📝 Login credentials:"
echo "   Email: admin@treelogistics.com"
echo "   Password: Admin123!"
echo ""

npm run dev

