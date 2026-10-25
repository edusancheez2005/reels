#!/usr/bin/env bash
# Publish an episode's video + cover to the `media` branch, served by GitHub Pages at
#   https://raw.githubusercontent.com/edusancheez2005/reels/media/v/<id>.mp4   (Instagram fetches the video from here)
#   and, if GitHub Pages is enabled for the media branch, https://edusancheez2005.github.io/reels/v/<id>.mp4
# The media branch is rewritten as a single commit holding only the newest $KEEP videos, so the repo
# never grows: once Instagram has published a reel it keeps its own copy.
# Usage: bash tools/publish_media.sh episodes/<id>      (prints VIDEO_URL / COVER_URL once live)
set -euo pipefail
EP="$(cd "${1%/}" && pwd)"; ID="$(basename "$EP")"
REPO_URL="https://github.com/edusancheez2005/reels"
BASE="https://edusancheez2005.github.io/reels"
KEEP="${KEEP:-12}"
test -f "$EP/$ID.mp4" || { echo "missing $EP/$ID.mp4" >&2; exit 1; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
git init -q -b media
git config user.email noreply@anthropic.com; git config user.name Claude
git remote add origin "$REPO_URL"
if git -c protocol.version=1 fetch -q --depth 1 origin media 2>/dev/null; then
  git checkout -q FETCH_HEAD -- . 2>/dev/null || true
fi
mkdir -p v
cp "$EP/$ID.mp4" "v/$ID.mp4"
[ -f "$EP/cover.jpg" ] && cp "$EP/cover.jpg" "v/$ID.jpg"
# keep only the newest $KEEP episodes (names start with YYYY-MM-DD)
ls v/*.mp4 2>/dev/null | sort | head -n -"$KEEP" | while read -r f; do rm -f "$f" "${f%.mp4}.jpg"; done
touch .nojekyll
{
  echo '<!doctype html><meta charset="utf-8"><title>reels media</title><h1>reels media</h1><ul>'
  for f in $(ls v/*.mp4 | sort -r); do n=$(basename "$f" .mp4); echo "<li><a href=\"v/$n.mp4\">$n</a></li>"; done
  echo '</ul>'
} > index.html
git add -A
git commit -q -m "media: $ID"
git -c protocol.version=1 push -q -f origin HEAD:media

RAW="https://raw.githubusercontent.com/edusancheez2005/reels/media/v/$ID.mp4"
PAGES="$BASE/v/$ID.mp4"
# raw.githubusercontent.com is live within seconds of the push; confirm it before handing over
for i in $(seq 1 12); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -I --max-time 20 "$RAW" || echo 000)
  [ "$code" = "200" ] && break
  sleep 5
done
[ "$code" = "200" ] || { echo "video not reachable yet at $RAW (HTTP $code)" >&2; exit 2; }
echo "VIDEO_URL=$RAW"
echo "COVER_URL=${RAW%.mp4}.jpg"
echo "PAGES_URL=$PAGES   # only works if GitHub Pages is enabled for the media branch (Settings → Pages)"
