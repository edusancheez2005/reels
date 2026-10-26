import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(null);

// Use a locally installed Chrome/Chromium instead of downloading one (offline or locked-down machines).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}

// 3D scenes (Three.js) need WebGL; SwiftShader-over-ANGLE works headless with no GPU.
Config.setChromiumOpenGlRenderer('swangle');
