#!/usr/bin/env bash
# Upload an episode's video + cover to a GitHub Release (public URL Instagram can fetch).
# Usage: bash tools/release.sh episodes/<id>
set -euo pipefail
EP="${1%/}"; ID="$(basename "$EP")"; REPO=edusancheez2005/reels
test -f "$EP/$ID.mp4" || { echo "missing $EP/$ID.mp4"; exit 1; }
NOTES="$EP/caption.txt"; [ -f "$NOTES" ] || NOTES=/dev/null
if gh release view "ep-$ID" -R "$REPO" >/dev/null 2>&1; then
  gh release upload "ep-$ID" "$EP/$ID.mp4" "$EP/cover.jpg" -R "$REPO" --clobber
else
  gh release create "ep-$ID" "$EP/$ID.mp4" "$EP/cover.jpg" -R "$REPO" -t "$ID" -F "$NOTES"
fi
URL="https://github.com/$REPO/releases/download/ep-$ID/$ID.mp4"
echo "$URL"
