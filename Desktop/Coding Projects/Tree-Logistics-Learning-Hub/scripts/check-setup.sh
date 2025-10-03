#!/bin/bash

echo "🔍 Tree Learning Hub - Setup Status Check"
echo "=========================================="
echo ""

# Check .env file
if [ -f .env ]; then
    echo "✅ .env file exists"
    
    # Check if DATABASE_URL is set
    if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=\"postgresql://postgres:postgres@localhost" .env; then
        echo "✅ DATABASE_URL appears to be configured"
    else
        echo "⚠️  DATABASE_URL needs to be configured with a real database"
        echo "   Current: Using default localhost PostgreSQL"
        echo "   Action: Get a free database from Neon or Supabase"
    fi
else
    echo "❌ .env file missing"
    echo "   Run: cp env.example .env"
fi

echo ""

# Check if database connection works
echo "🗄️  Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database"
    echo "   1. Make sure your DATABASE_URL in .env is correct"
    echo "   2. Get a free database from:"
    echo "      - https://neon.tech (Recommended)"
    echo "      - https://supabase.com"
    echo "      - https://railway.app"
fi

echo ""

# Check if node_modules exists
if [ -d node_modules ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not installed"
    echo "   Run: npm install"
fi

echo ""

# Check if Prisma client is generated
if [ -d node_modules/.prisma/client ]; then
    echo "✅ Prisma Client generated"
else
    echo "⚠️  Prisma Client not generated"
    echo "   Run: npx prisma generate"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="

if [ ! -f .env ]; then
    echo "1. Create .env file: cp env.example .env"
    echo "2. Get a free database from https://neon.tech"
    echo "3. Update DATABASE_URL in .env"
    echo "4. Run: npx prisma db push"
    echo "5. Run: npm run db:seed"
    echo "6. Run: npm run dev"
elif ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "1. Get a free database from https://neon.tech"
    echo "2. Update DATABASE_URL in .env"
    echo "3. Run: npx prisma db push"
    echo "4. Run: npm run db:seed"
    echo "5. Run: npm run dev"
else
    echo "1. Run: npx prisma db push (if not done)"
    echo "2. Run: npm run db:seed (if not done)"
    echo "3. Run: npm run dev"
    echo "4. Open: http://localhost:3000"
    echo ""
    echo "Login: admin@treelogistics.com / Admin123!"
fi

echo ""

