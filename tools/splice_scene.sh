#!/usr/bin/env bash
# Re-render one frame range of a finished reel and splice it in, instead of re-rendering the whole video.
# Usage (repo root, after build_timeline.py has installed the updated timeline): bash tools/splice_scene.sh episodes/<id> <first> <last>
# Renders frames <first>..<last> with Remotion, swaps them into episodes/<id>/<id>.mp4 (video re-encoded once, audio copied).
set -euo pipefail
EP="$1"; A="$2"; B="$3"
ID="$(basename "$EP")"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MP4="$ROOT/$EP/$ID.mp4"
TMP="$(mktemp -d)"
source "$ROOT/.env.local"; export REMOTION_BROWSER
(cd "$ROOT/reel-studio" && npx remotion render Reel "$TMP/part.mp4" --frames="$A-$B" --codec h264 --crf 18 --x264-preset veryfast --log error)
N=$((B - A + 1))
if [ "$A" -eq 0 ]; then
  FC="[1:v]trim=end_frame=$N,setpts=PTS-STARTPTS[mid];[0:v]trim=start_frame=$((B + 1)),setpts=PTS-STARTPTS[post];[mid][post]concat=n=2:v=1:a=0[v]"
else
  FC="[0:v]trim=end_frame=$A,setpts=PTS-STARTPTS[pre];[1:v]trim=end_frame=$N,setpts=PTS-STARTPTS[mid];[0:v]trim=start_frame=$((B + 1)),setpts=PTS-STARTPTS[post];[pre][mid][post]concat=n=3:v=1:a=0[v]"
fi
ffmpeg -v error -y -i "$MP4" -i "$TMP/part.mp4" -filter_complex "$FC" \
  -map "[v]" -map 0:a -c:v libx264 -crf 18 -preset veryfast -pix_fmt yuv420p -c:a copy -movflags +faststart "$TMP/out.mp4"
F0=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$MP4")
F1=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$TMP/out.mp4")
if [ "$F0" != "$F1" ]; then echo "frame count changed ($F0 -> $F1); keeping the original" >&2; exit 1; fi
mv "$TMP/out.mp4" "$MP4"
rm -rf "$TMP"
echo "spliced frames $A-$B into $MP4 ($F1 frames)"
