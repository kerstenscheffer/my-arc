#!/bin/bash

# Path naar je nieuwe icon (pas dit aan naar waar je nieuwe icon staat)
SOURCE_ICON="$HOME/Downloads/my_arc_icon.png"

# Check of ImageMagick geïnstalleerd is
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick..."
    brew install imagemagick
fi

# Resize naar alle benodigde formaten
echo "Creating PWA icons..."
convert "$SOURCE_ICON" -resize 48x48 public/icons/icon-48x48.png
convert "$SOURCE_ICON" -resize 72x72 public/icons/icon-72x72.png
convert "$SOURCE_ICON" -resize 96x96 public/icons/icon-96x96.png
convert "$SOURCE_ICON" -resize 128x128 public/icons/icon-128x128.png
convert "$SOURCE_ICON" -resize 144x144 public/icons/icon-144x144.png
convert "$SOURCE_ICON" -resize 152x152 public/icons/icon-152x152.png
convert "$SOURCE_ICON" -resize 192x192 public/icons/icon-192x192.png
convert "$SOURCE_ICON" -resize 384x384 public/icons/icon-384x384.png
convert "$SOURCE_ICON" -resize 512x512 public/icons/icon-512x512.png

echo "✅ All icons created!"
ls -la public/icons/
