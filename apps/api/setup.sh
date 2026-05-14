#!/bin/bash

echo "🚀 Setting up Government Scheme AI Assistant API..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database with government schemes..."
node prisma/seed.js

echo "✅ Setup complete!"
echo ""
echo "To start the server, run: npm start"

#  
