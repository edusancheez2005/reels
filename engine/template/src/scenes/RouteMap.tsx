import React, {useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {geoMercator, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';
import {Stage, revealFrame, LEAD_FRAMES, type SceneProps} from '../lib/anim';
import {usePal, rgba} from '../lib/palette';
import {theme} from '../lib/theme';
import {CargoShip} from '../lib/illustrations';

/**
 * A real world map (Natural Earth 1:110m via world-atlas) with animated routes, pins and a camera.
 * - legs: [{route: 'uk-cn' | 'cn-uk' | [[lon,lat],…], beat, dur?, color?, ship?}] — the line draws from its beat
 *   over `dur` frames, with a ship riding the tip if `ship` is true.
 * - pins: [{name, lon, lat, beat, side?}] pop on their beat.
 * - cam:  [{beat, lon, lat, zoom}] the camera glides to each on its beat (default: fit the bbox).
 */
type LonLat = [number, number];
type Leg = {route: string | LonLat[]; beat: number; dur?: number; color?: string; ship?: boolean; label?: string};
type Pin = {name: string; lon: number; lat: number; beat: number; hide?: number; side?: 'left' | 'right' | 'top' | 'bottom'};
type Cam = {beat: number; lon: number; lat: number; zoom: number};
type P = {legs?: Leg[]; pins?: Pin[]; cam?: Cam[]; bbox?: [number, number, number, number]};

// Scotland → Suez → China (sea lanes, approximate)
const UK_CN: LonLat[] = [
  [-1.8, 57.5], [1.2, 55.2], [1.6, 51.1], [-2.5, 49.9], [-6.0, 48.4], [-10.2, 44.0], [-10.0, 38.6], [-6.2, 35.95],
  [-1.0, 36.6], [6.0, 37.6], [12.0, 36.8], [20.0, 34.4], [28.0, 32.4], [32.3, 31.4], [32.5, 30.3], [32.6, 29.6],
  [34.5, 26.8], [37.6, 22.0], [41.0, 16.0], [43.4, 12.6], [48.0, 12.2], [55.0, 13.0], [65.0, 11.0], [74.0, 7.0],
  [80.0, 5.5], [86.0, 5.8], [93.0, 6.4], [97.5, 5.0], [101.0, 2.8], [103.9, 1.25], [106.0, 3.5], [109.5, 9.0],
  [112.0, 15.0], [115.5, 20.5], [119.0, 23.5], [121.6, 27.5], [122.6, 31.0], [121.5, 34.2], [120.4, 36.0],
];
export const ROUTES: Record<string, LonLat[]> = {'uk-cn': UK_CN, 'cn-uk': [...UK_CN].reverse()};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = land110 as any;
const LAND = feature(topo, topo.objects.land);

const polyLen = (pts: [number, number][]) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return cum;
};
const pointAt = (pts: [number, number][], cum: number[], t: number) => {
  const L = cum[cum.length - 1] * t;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < L) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const seg = cum[i] - cum[i - 1] || 1;
  const u = Math.min(1, Math.max(0, (L - cum[i - 1]) / seg));
  return {x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, ang: Math.atan2(b[1] - a[1], b[0] - a[0])};
};

export const RouteMap: React.FC<SceneProps<P>> = ({props, beats}) => {
  const frame = useCurrentFrame();
  const pal = usePal();
  const dark = pal.name === 'dark';
  const [lo0, la0, lo1, la1] = props.bbox ?? [-18, -6, 132, 62];
  const {proj, landD} = useMemo(() => {
    const pr = geoMercator().fitExtent([[30, 30], [970, 870]], {type: 'MultiPoint', coordinates: [[lo0, la0], [lo1, la1]]} as never);
    return {proj: pr, landD: geoPath(pr)(LAND as never) ?? ''};
  }, [lo0, la0, lo1, la1]);
  const P = (ll: LonLat) => proj(ll) as [number, number];

  // camera
  const base = {x: 500, y: 450, z: 1};
  const cams = (props.cam ?? []).map((c) => {
    const [x, y] = P([c.lon, c.lat]);
    return {f: revealFrame(beats, c.beat) - LEAD_FRAMES - 6, x, y, z: c.zoom};
  });
  // camera: glide from the previous keyframe to the current one; a keyframe at/under frame 0 is the opening shot
  let ci = -1;
  cams.forEach((c, i) => {
    if (frame >= c.f) ci = i;
  });
  const opening = cams.length && cams[0].f <= 0 ? cams[0] : base;
  const cur = ci < 0 ? opening : cams[ci];
  const prev = ci <= 0 ? opening : cams[ci - 1];
  const t0 = ci < 0 ? 0 : cams[ci].f;
  const m = interpolate(frame, [t0, t0 + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const cx = prev.x + (cur.x - prev.x) * m;
  const cy = prev.y + (cur.y - prev.y) * m;
  const z = prev.z + (cur.z - prev.z) * m;
  const T = (x: number, y: number) => ({x: 500 + (x - cx) * z, y: 450 + (y - cy) * z});
  const camT = `translate(${500 - cx * z} ${450 - cy * z}) scale(${z})`;

  const sea = dark ? '#0D1524' : '#DCEAF7';
  const landFill = dark ? '#1E2736' : '#FFFFFF';
  const coast = dark ? '#33415A' : '#B9C7D6';

  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, borderRadius: 40, overflow: 'hidden', background: sea, boxShadow: pal.shadow}}>
        <svg width={1000} height={900} style={{position: 'absolute', inset: 0}}>
          <g transform={camT}>
            <path d={landD} fill={landFill} stroke={coast} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            {(props.legs ?? []).map((leg, k) => {
              const ll = typeof leg.route === 'string' ? ROUTES[leg.route] : leg.route;
              const pts = ll.map(P);
              const cum = polyLen(pts);
              const L = cum[cum.length - 1];
              const st = revealFrame(beats, leg.beat) - LEAD_FRAMES;
              const p = interpolate(frame, [st, st + (leg.dur ?? 36)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
              if (p <= 0) return null;
              const color = leg.color ?? (k % 2 ? pal.accent : '#F97316');
              const d = pts.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');
              return (
                <g key={k}>
                  <path d={d} fill="none" stroke={rgba(color, 0.25)} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray={`${L * p * z} ${L * z + 10}`} />
                  <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray={`${L * p * z} ${L * z + 10}`} />
                </g>
              );
            })}
          </g>
          {/* ships ride the tip, drawn in screen space so they don't scale with the camera */}
          {(props.legs ?? []).map((leg, k) => {
            if (!leg.ship) return null;
            const ll = typeof leg.route === 'string' ? ROUTES[leg.route] : leg.route;
            const pts = ll.map(P);
            const cum = polyLen(pts);
            const st = revealFrame(beats, leg.beat) - LEAD_FRAMES;
            const end = st + (leg.dur ?? 36);
            const p = interpolate(frame, [st, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
            if (p <= 0) return null;
            const q = pointAt(pts, cum, Math.max(0.001, p));
            const s = T(q.x, q.y);
            const left = Math.cos(q.ang) < 0;
            return (
              <g key={`s${k}`} transform={`translate(${s.x} ${s.y})`}>
                <g transform={`scale(${left ? -0.3 : 0.3} 0.3) translate(-210 -150)`}>
                  <CargoShip />
                </g>
                {leg.label ? (
                  <g transform="translate(0 -70)">
                    <rect x={-80} y={-26} width={160} height={44} rx={22} fill={pal.panel} stroke={pal.line} />
                    <text x={0} y={5} textAnchor="middle" fontFamily={theme.font} fontWeight={800} fontSize={24} fill={pal.text}>{leg.label}</text>
                  </g>
                ) : null}
              </g>
            );
          })}
          {(props.pins ?? []).map((pin, k) => {
            const st = revealFrame(beats, pin.beat) - LEAD_FRAMES;
            const hideAt = pin.hide !== undefined ? revealFrame(beats, pin.hide) - LEAD_FRAMES - 6 : Infinity;
            const p = interpolate(frame, [st, st + 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.8))}) * (Number.isFinite(hideAt) ? interpolate(frame, [hideAt, hideAt + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1);
            if (p <= 0) return null;
            const [x, y] = P([pin.lon, pin.lat]);
            const s = T(x, y);
            const side = pin.side ?? 'right';
            const w = pin.name.length * 19 + 44;
            const lx = side === 'left' ? -w - 26 : side === 'right' ? 26 : -w / 2;
            const ly = side === 'top' ? -86 : side === 'bottom' ? 30 : -28;
            return (
              <g key={k} transform={`translate(${s.x} ${s.y}) scale(${p})`}>
                <circle r={16} fill={rgba('#F97316', 0.25)} />
                <circle r={8} fill="#F97316" stroke="#fff" strokeWidth={3} />
                <rect x={lx} y={ly} width={w} height={56} rx={28} fill={pal.text} />
                <text x={lx + w / 2} y={ly + 38} textAnchor="middle" fontFamily={theme.font} fontWeight={800} fontSize={32} fill={pal.bg}>{pin.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </Stage>
  );
};
