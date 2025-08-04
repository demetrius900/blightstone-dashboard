#!/bin/bash

echo "🚀 Starting Blightstone Development Environment..."
echo ""

# Check if Supabase is already running
if curl -s http://127.0.0.1:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase is already running at http://127.0.0.1:54321"
else
    echo "🔄 Starting local Supabase..."
    supabase start
    echo "✅ Supabase started at http://127.0.0.1:54321"
fi

echo "📊 Studio Dashboard: http://127.0.0.1:54323"
echo "🌐 Starting your app at http://localhost:8000"
echo ""
echo "💡 Press Ctrl+C to stop both services"
echo ""

# Start the app (this will use local Supabase automatically)
npm run preview