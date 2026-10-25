import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';

/**
 * A real screenshot in a browser/card frame. The camera moves to `cam[i]` on beat i
 * (x,y = focus point as 0–1 of the image, zoom ≥ 1), and `marks` draw on their beat:
 * box (Figma-style selection), underline (marker stroke), circle (hand-drawn ring), spot (dim the rest).
 * Mark coordinates are in the screenshot's own pixels; `size` = [w, h] of the image
 * (build_timeline.py fills it in automatically).
 */
type Cam = {x: number; y: number; zoom?: number};
type Mark = {beat: number; kind: 'box' | 'underline' | 'circle' | 'spot'; x: number; y: number; w: number; h: number; color?: string};
type P = {
  src: string;
  size?: [number, number];
  chrome?: 'browser' | 'card' | 'none';
  url?: string;
  width?: number;
  maxHeight?: number;
  cam?: Cam[];
  marks?: Mark[];
  tilt?: boolean;
  source?: string;
};

const SELECT = '#3D86FF';

const BoxMark: React.FC<{p: number; color: string}> = ({p, color}) => (
  <div style={{position: 'absolute', inset: 0, border: `4px solid ${color}`, borderRadius: 6, background: rgba(color, 0.08), opacity: p, transform: `scale(${interpolate(p, [0, 1], [1.12, 1])})`}}>
    {[{left: -9, top: -9}, {right: -9, bottom: -9}, {right: -9, top: -9}, {left: -9, bottom: -9}].map((pos, k) => (
      <div key={k} style={{position: 'absolute', width: 15, height: 15, borderRadius: 3, background: '#fff', border: `3px solid ${color}`, boxSizing: 'border-box', ...pos}} />
    ))}
  </div>
);

const Underline: React.FC<{p: number; w: number; h: number; color: string}> = ({p, w, h, color}) => {
  const y = h + 6;
  const d = `M -4 ${y} C ${w * 0.25} ${y + 7}, ${w * 0.55} ${y - 5}, ${w + 6} ${y + 3}`;
  const L = w * 1.15 + 20;
  return (
    <svg width={w} height={h + 30} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} opacity={0.95} />
    </svg>
  );
};

const Circle: React.FC<{p: number; w: number; h: number; color: string}> = ({p, w, h, color}) => {
  const rx = w / 2 + 22;
  const ry = h / 2 + 16;
  const cx = w / 2;
  const cy = h / 2;
  const d = `M ${cx + rx * 0.9} ${cy - ry * 0.55} C ${cx + rx * 1.2} ${cy + ry * 0.4}, ${cx + rx * 0.2} ${cy + ry * 1.15}, ${cx - rx * 0.55} ${cy + ry * 0.9} C ${cx - rx * 1.25} ${cy + ry * 0.5}, ${cx - rx * 1.05} ${cy - ry * 0.95}, ${cx - rx * 0.1} ${cy - ry * 1.05} C ${cx + rx * 0.6} ${cy - ry * 1.15}, ${cx + rx * 1.05} ${cy - ry * 0.6}, ${cx + rx * 0.75} ${cy - ry * 0.2}`;
  const L = Math.PI * (rx + ry) * 1.25;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={d} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
    </svg>
  );
};

export const Shot: React.FC<SceneProps<P>> = ({props, beats, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pal = usePal();
  const [iw, ih] = props.size ?? [1000, 700];
  const W = props.width ?? 920;
  const H = (W * ih) / iw;
  const chrome = props.chrome ?? 'browser';
  const barH = chrome === 'browser' ? 58 : 0;
  const VH = Math.min(H, (props.maxHeight ?? 800) - barH);
  const VW = W;
  const k = W / iw;

  // camera keyframes: default "fit, top-aligned"
  const base: Cam = {x: 0.5, y: VH < H ? VH / 2 / H : 0.5, zoom: 1};
  const cams = props.cam && props.cam.length ? props.cam : [base];
  let ci = -1;
  cams.forEach((_, i) => {
    if (frame >= revealFrame(beats, i) - LEAD_FRAMES - 4) ci = i;
  });
  const from = ci <= 0 ? (ci === 0 ? base : base) : cams[ci - 1];
  const to = ci < 0 ? base : cams[ci];
  const t0 = ci < 0 ? 0 : revealFrame(beats, ci) - LEAD_FRAMES - 4;
  const m = interpolate(frame, [t0, t0 + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const prev = ci === 0 ? base : from;
  const cx = prev.x + (to.x - prev.x) * m;
  const cy = prev.y + (to.y - prev.y) * m;
  const z = (prev.zoom ?? 1) + ((to.zoom ?? 1) - (prev.zoom ?? 1)) * m;
  let tx = VW / 2 - cx * W * z;
  let ty = VH / 2 - cy * H * z;
  tx = W * z <= VW ? (VW - W * z) / 2 : Math.min(0, Math.max(VW - W * z, tx));
  ty = H * z <= VH ? (VH - H * z) / 2 : Math.min(0, Math.max(VH - H * z, ty));

  const enter = spring({frame, fps, durationInFrames: 18, config: {damping: 16, stiffness: 120}});
  const tilt = props.tilt === false ? 0 : 1 - enter;
  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  const src = props.src.startsWith('http') ? props.src : staticFile(props.src);

  const spot = (props.marks ?? []).filter((mk) => mk.kind === 'spot' && frame >= revealFrame(beats, mk.beat) - LEAD_FRAMES);
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, perspective: 1800}}>
        <div
          style={{
            position: 'absolute',
            left: (1000 - VW) / 2,
            top: (900 - VH - barH) / 2,
            width: VW,
            borderRadius: chrome === 'none' ? 0 : 26,
            overflow: 'hidden',
            background: pal.panel,
            border: chrome === 'none' ? 'none' : `1.5px solid ${pal.line}`,
            boxShadow: pal.shadow,
            transform: `rotateY(${tilt * -22 + (drift - 0.5) * 3}deg) rotateX(${tilt * 10}deg) translateY(${tilt * 60}px) scale(${0.92 + enter * 0.08})`,
            opacity: interpolate(enter, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {chrome === 'browser' ? (
            <div style={{height: barH, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: pal.panel2, borderBottom: `1px solid ${pal.line}`}}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                <div key={c} style={{width: 15, height: 15, borderRadius: 8, background: c}} />
              ))}
              {props.url ? (
                <div style={{marginLeft: 14, flex: 1, height: 36, borderRadius: 10, background: pal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pal.muted, fontFamily: theme.font, fontSize: 22, fontWeight: 600}}>
                  🔒 {props.url}
                </div>
              ) : null}
            </div>
          ) : null}
          <div style={{position: 'relative', width: VW, height: VH, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: '0 0'}}>
              <Img src={src} style={{width: W, height: H, display: 'block'}} />
              {spot.length ? (
                <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
                  <defs>
                    <mask id="spotmask">
                      <rect width={W} height={H} fill="white" />
                      {spot.map((mk, j) => (
                        <rect key={j} x={mk.x * k - 8} y={mk.y * k - 8} width={mk.w * k + 16} height={mk.h * k + 16} rx={10} fill="black" />
                      ))}
                    </mask>
                  </defs>
                  <rect width={W} height={H} fill="rgba(0,0,0,0.55)" mask="url(#spotmask)" />
                </svg>
              ) : null}
              {(props.marks ?? []).map((mk, j) => {
                if (mk.kind === 'spot') return null;
                const st = revealFrame(beats, mk.beat) - LEAD_FRAMES;
                const p = interpolate(frame, [st, st + (mk.kind === 'box' ? 7 : 13)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
                if (p <= 0) return null;
                const color = mk.color ?? (mk.kind === 'box' ? SELECT : mk.kind === 'underline' ? '#FFD233' : '#FF4D4D');
                const w = mk.w * k;
                const h = mk.h * k;
                return (
                  <div key={j} style={{position: 'absolute', left: mk.x * k, top: mk.y * k, width: w, height: h}}>
                    {mk.kind === 'box' ? <BoxMark p={p} color={color} /> : mk.kind === 'underline' ? <Underline p={p} w={w} h={h} color={color} /> : <Circle p={p} w={w} h={h} color={color} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {props.source ? (
          <div style={{position: 'absolute', left: (1000 - VW) / 2 + 8, top: (900 - VH - barH) / 2 + VH + barH + 18, fontFamily: theme.font, fontSize: 22, fontWeight: 600, color: pal.muted, opacity: enter}}>
            Source: {props.source}
          </div>
        ) : null}
      </div>
    </Stage>
  );
};
