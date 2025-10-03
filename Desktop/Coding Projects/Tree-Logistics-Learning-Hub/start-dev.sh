#!/bin/bash

# Set environment variables
export NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
export NEXTAUTH_URL="http://localhost:3000"
export DATABASE_URL="postgresql://user:password@localhost:5432/tree_learning_hub?schema=public"

# Start the development server
npm run dev
