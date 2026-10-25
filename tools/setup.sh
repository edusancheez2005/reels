#!/usr/bin/env bash
# One-time-per-session setup: studio deps, free voice, headless Chrome. Safe to re-run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d reel-studio/node_modules ]; then
  rm -rf reel-studio && cp -r engine/template reel-studio
  (cd reel-studio && npm install --no-audit --no-fund --loglevel=error)
fi

python3 -c "import kokoro_onnx, soundfile, numpy" 2>/dev/null || \
  pip install -q --break-system-packages kokoro-onnx soundfile numpy matplotlib

# Remotion needs a headless Chrome; prefer one already on the machine
CH="${REMOTION_BROWSER:-}"
if [ -z "$CH" ]; then
  CH=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1 || true)
fi
if [ -z "$CH" ]; then
  CH=$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)
fi
: > .env.local
[ -n "$CH" ] && echo "export REMOTION_BROWSER=$CH" >> .env.local

# fonts: use the system Inter when installed (offline-safe), else Google Fonts
if fc-list 2>/dev/null | grep -i "Inter" >/dev/null; then echo "export REEL_FONT_SOURCE=system" >> .env.local; else echo "export REEL_FONT_SOURCE=google" >> .env.local; fi

# warm the voice model cache (~350 MB from GitHub, once per machine)
python3 - <<'PY'
from pathlib import Path
import urllib.request
c = Path.home() / ".cache" / "kokoro"; c.mkdir(parents=True, exist_ok=True)
for f in ["kokoro-v1.0.onnx", "voices-v1.0.bin"]:
    p = c / f
    if not p.exists() or p.stat().st_size < 1000:
        urllib.request.urlretrieve("https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/" + f, p)
print("voice model ready")
PY
echo "setup ok — now: source .env.local"
cat .env.local
