#!/bin/sh
# Make small, lazy-loaded WebP thumbnails from the existing landscape assets.
set -eu
find public/themes -name '*-landscape.png' | while IFS= read -r source; do
  destination="${source%-landscape.png}-thumb.webp"
  convert "$source" -resize '320x320>' -quality 78 "$destination"
done
