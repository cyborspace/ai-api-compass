#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Stopping old processes..."

pkill -f "next dev" 2>/dev/null || true
pkill -f "tsx.*src/index.ts" 2>/dev/null || true
pkill -f "node.*dist/index.js" 2>/dev/null || true

sleep 1

echo "✅ Old processes stopped"

echo "🚀 Starting backend..."
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

sleep 2

echo "🚀 Starting frontend..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "💡 To stop all: pkill -f 'next dev' && pkill -f 'tsx.*src/index.ts'"
