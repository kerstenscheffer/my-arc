#!/bin/bash
# Force clear all caches and restart

echo "🧹 Clearing all caches..."

# Clear node_modules cache
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# Clear any dist folders
rm -rf dist

# Clear browser cache instruction
echo ""
echo "=========================================="
echo "⚠️  BELANGRIJK: DOE DIT IN JE BROWSER:"
echo "=========================================="
echo ""
echo "1. Open DevTools (F12)"
echo "2. Ga naar Application tab"
echo "3. Klik op 'Clear site data'"
echo "4. OF: Rechtsklik refresh button → 'Empty Cache and Hard Reload'"
echo ""
echo "OF gebruik Incognito/Private mode!"
echo ""
echo "=========================================="
echo ""

# Restart dev server
echo "🔄 Start dev server..."
npm run dev
