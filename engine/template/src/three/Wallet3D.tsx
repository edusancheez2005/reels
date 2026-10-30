import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {Easing, interpolate} from 'remotion';
import type {SceneProps} from '../lib/anim';
import {BlobShadow, Caption, Studio, Tags, canvasTex, clamp01, rand, useCamera, useClock, type Cam, type Tag} from './kit';

/**
 * Wallet3D.tsx — two story-built scenes for "what a wallet really holds" / recovery-phrase scams.
 *
 * Seed3D — a cream recovery-phrase card (12 numbered example words) on a dark walnut desk, a generic unbranded hardware
 * wallet beside it, and an optional wall of 2,048 word tiles behind.
 *   card      the card slides in onto the desk (without it the card starts in place)
 *   write     the words write in one by one (`dur` frames, default 36). Without it, words start written unless `blank`.
 *   glow      the words light up cyan (the words ARE the key)
 *   key       a gold key rises out of the card and turns slowly
 *   wall      a wall of 2,048 dim word tiles fades in behind the card (a counter tag is up to you)
 *   pick      12 tiles flash amber and fly from the wall onto the card (the words write in as they land)
 *   device    the hardware wallet slides in from the right (without it, it's there if `device: true`)
 *   restore   the device screen goes from "Enter word" to "Wallet restored" with a cyan ring
 *   copy      glowing copies of the words lift off the card and fly away, turning red (someone else has them now)
 *   two       a second copy of the card slides to the right (two copies, two places)
 *   label:<n> show tag n        cam   (no-op beat for cam[])
 * props: words (12), title, device (bool), blank (bool), wordsLit (start glowing), tags, caption, cam
 *
 * Letter3D — a scam letter (generic, no brand: "IMPORTANT NOTICE", grey text, a QR code, a deadline box, a hologram seal)
 * arrives in an envelope on the desk; a phone shows the fake page the QR code leads to.
 *   arrive    the envelope drops onto the desk     open   the flap opens and the letter slides out flat
 *   qr        a scan beam sweeps the QR code       deadline  a red DEADLINE stamp thumps onto the letter
 *   site      a phone rises showing a fake "verify your wallet" page with 12 empty boxes
 *   type      the boxes fill one by one             steal  the words fly out of the phone, red, off to the left
 *   label:<n>, cam
 * props: deadline (text in the box, e.g. "15 FEB"; only what the real letter said), deadlineLabel (default "COMPLETE BY"), opened (start with the letter out), phone (start with the phone up),
 *        tags, caption, cam
 */

const FONT = 'Inter, "DejaVu Sans", Arial, sans-serif';
const DEFAULT_WORDS = ['orbit', 'cabin', 'harbor', 'velvet', 'maple', 'rocket', 'salad', 'timber', 'frozen', 'island', 'pepper', 'wisdom'];
const CYAN = '#3bc9ee';
const AMBER = '#FFB547';
const RED = '#FF5A4E';

// ---------- shared desk ----------
const useDesk = () =>
  useMemo(() => {
    const wood = canvasTex(1024, 1024, (g) => {
      g.fillStyle = '#2a1a10';
      g.fillRect(0, 0, 1024, 1024);
      for (let y = 0; y < 1024; y += 2) {
        const v = 0.5 + 0.5 * Math.sin(y / 9 + Math.sin(y / 61) * 3);
        g.fillStyle = `rgba(${90 + v * 40},${55 + v * 25},${30 + v * 12},0.35)`;
        g.fillRect(0, y, 1024, 2);
      }
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = `rgba(20,10,5,${0.15 + rand(i) * 0.2})`;
        g.lineWidth = 1 + rand(i + 3) * 2;
        g.beginPath();
        const y0 = rand(i + 7) * 1024;
        g.moveTo(0, y0);
        for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y0 + Math.sin(x / 120 + i) * 12);
        g.stroke();
      }
    });
    if (wood) {
      wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
      wood.repeat.set(2, 2);
    }
    return new THREE.MeshPhysicalMaterial({map: wood ?? undefined, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.35});
  }, []);

const Desk: React.FC<{mat: THREE.Material}> = ({mat}) => (
  <>
    <mesh material={mat} position={[0, -0.08, -0.5]}>
      <boxGeometry args={[14, 0.16, 9]} />
    </mesh>
    {/* a pen and a mug for scale and life */}
    <group position={[-2.3, 0.04, -1.3]} rotation={[0, 0.6, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.045, 0.045, 1.1, 16]} />
        <meshStandardMaterial color="#20242c" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[0.045, 0.12, 16]} />
        <meshStandardMaterial color="#c9a45a" roughness={0.25} metalness={1} />
      </mesh>
    </group>
    <group position={[2.6, 0, -2.0]}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.42, 0.38, 0.84, 40, 1, true]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 40]} />
        <meshStandardMaterial color="#2b170c" roughness={0.2} />
      </mesh>
      <mesh position={[0.46, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.17, 0.045, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.4} />
      </mesh>
    </group>
  </>
);

const Key: React.FC<{mat: THREE.Material}> = ({mat}) => (
  <group>
    <mesh material={mat}>
      <torusGeometry args={[0.2, 0.06, 20, 48]} />
    </mesh>
    <mesh material={mat} position={[0.66, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.04, 0.04, 0.85, 20]} />
    </mesh>
    {[0.82, 0.92, 1.0].map((x, i) => (
      <mesh key={i} material={mat} position={[x, -0.07 - (i % 2) * 0.03, 0]}>
        <boxGeometry args={[0.06, 0.1 + (i % 2) * 0.06, 0.06]} />
      </mesh>
    ))}
  </group>
);

/** A small texture with one word, for flying copies. */
const wordTex = (w: string, col: string) =>
  canvasTex(256, 80, (g) => {
    g.clearRect(0, 0, 256, 80);
    g.font = `800 46px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = col;
    g.shadowBlur = 16;
    g.fillStyle = '#ffffff';
    g.fillText(w, 128, 42);
    g.shadowBlur = 0;
    g.fillStyle = col;
    g.globalAlpha = 0.55;
    g.fillText(w, 128, 42);
  });

// ---------- card ----------
const CARD_W = 2.6;
const CARD_D = 1.78;
const cellPos = (i: number): [number, number] => {
  // 3 columns × 4 rows, local card coords (x right, z toward camera)
  const col = i % 3;
  const row = Math.floor(i / 3);
  return [-0.82 + col * 0.82, -0.42 + row * 0.33];
};

const drawCard = (g: CanvasRenderingContext2D, words: string[], n: number, lit: number, title: string, faded: number) => {
  const W = 1040;
  const H = 712;
  g.fillStyle = '#f3ecdc';
  g.fillRect(0, 0, W, H);
  // paper fibres
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(120,100,70,${rand(i) * 0.06})`;
    g.fillRect(rand(i + 1) * W, rand(i + 2) * H, 1 + rand(i + 3) * 3, 1);
  }
  g.strokeStyle = '#c9bea6';
  g.lineWidth = 4;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.fillStyle = '#3a3226';
  g.font = `800 40px ${FONT}`;
  g.fillText(title, 50, 82);
  g.fillStyle = '#8a7d66';
  g.font = `600 26px ${FONT}`;
  g.fillText('example words · not a real wallet', 50, 122);
  for (let i = 0; i < 12; i++) {
    const [cx, cz] = cellPos(i);
    const x = ((cx + CARD_W / 2) / CARD_W) * W - 150;
    const y = ((cz + CARD_D / 2) / CARD_D) * H + 10;
    g.fillStyle = '#9a8c72';
    g.font = `700 30px ${FONT}`;
    g.fillText(String(i + 1).padStart(2, '0'), x, y);
    g.strokeStyle = '#d6cbb3';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + 52, y + 10);
    g.lineTo(x + 280, y + 10);
    g.stroke();
    if (i < n) {
      g.globalAlpha = 1 - faded * 0.82;
      if (lit > 0) {
        g.shadowColor = CYAN;
        g.shadowBlur = 22 * lit;
      }
      g.fillStyle = lit > 0.5 ? '#0b6f8c' : '#1f2a44';
      g.font = `italic 700 46px ${FONT}`;
      g.fillText(words[i], x + 58, y);
      g.shadowBlur = 0;
      g.globalAlpha = 1;
    }
  }
};

const useCardTextures = (words: string[], title: string) => {
  const cache = useMemo(() => new Map<string, THREE.Texture | null>(), [words, title]);
  return (n: number, lit: number, faded: number) => {
    const key = `${n}|${Math.round(lit * 4)}|${Math.round(faded * 4)}`;
    if (!cache.has(key)) cache.set(key, canvasTex(1040, 712, (g) => drawCard(g, words, n, Math.round(lit * 4) / 4, title, Math.round(faded * 4) / 4)));
    return cache.get(key) ?? null;
  };
};

const Card: React.FC<{tex: THREE.Texture | null; glow?: number}> = ({tex, glow = 0}) => {
  const geo = useMemo(() => new RoundedBoxGeometry(CARD_W, 0.025, CARD_D, 2, 0.02), []);
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#efe7d6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.0135, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CARD_W - 0.01, CARD_D - 0.01]} />
        <meshStandardMaterial map={tex ?? undefined} roughness={0.85} emissive={CYAN} emissiveIntensity={glow * 0.12} />
      </mesh>
    </group>
  );
};

// ---------- hardware wallet (generic) ----------
const screenTex = (state: 'enter' | 'ok') =>
  canvasTex(420, 260, (g) => {
    g.fillStyle = '#05070a';
    g.fillRect(0, 0, 420, 260);
    g.textAlign = 'center';
    if (state === 'enter') {
      g.fillStyle = '#e9f0f7';
      g.font = `700 40px ${FONT}`;
      g.fillText('Enter word', 210, 100);
      g.fillStyle = CYAN;
      g.font = `800 64px ${FONT}`;
      g.fillText('#1', 210, 180);
    } else {
      g.fillStyle = '#3DDC84';
      g.font = `800 70px ${FONT}`;
      g.fillText('✓', 210, 110);
      g.fillStyle = '#e9f0f7';
      g.font = `700 36px ${FONT}`;
      g.fillText('Wallet restored', 210, 190);
    }
  });

const Device: React.FC<{restored: number; frame: number}> = ({restored, frame}) => {
  const geo = useMemo(() => new RoundedBoxGeometry(0.78, 0.14, 1.32, 4, 0.06), []);
  const t1 = useMemo(() => screenTex('enter'), []);
  const t2 = useMemo(() => screenTex('ok'), []);
  return (
    <group>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#15181d" roughness={0.35} metalness={0.4} clearcoat={0.8} clearcoatRoughness={0.25} />
      </mesh>
      {/* steel swivel cover edge */}
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={[0.03, 0.15, 1.36]} />
        <meshStandardMaterial color="#b9c0c8" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.072, -0.22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.37]} />
        <meshBasicMaterial map={(restored > 0.5 ? t2 : t1) ?? undefined} toneMapped={false} />
      </mesh>
      {[-0.17, 0.17].map((x, i) => (
        <mesh key={i} position={[x, 0.075, 0.32]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
          <meshStandardMaterial color="#2a2f37" roughness={0.4} />
        </mesh>
      ))}
      {restored > 0 ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + restored * 0.6}>
          <ringGeometry args={[0.75, 0.8, 64]} />
          <meshBasicMaterial color={CYAN} transparent opacity={(1 - restored) * 0.9 + 0.15 * Math.sin(frame / 5) ** 2} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------- Seed3D ----------
type SeedP = {
  actions?: string[];
  cam?: Cam[];
  tags?: Tag[];
  caption?: string;
  words?: string[];
  title?: string;
  device?: boolean;
  blank?: boolean;
  wordsLit?: boolean;
  dur?: number;
};

const WALL_COLS = 32;
const WALL_ROWS = 64;

export const Seed3D: React.FC<SceneProps<SeedP>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, has} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 4.2, 4.2], look: [0, 0, 0.1], fov: 34});
  const words = props.words ?? DEFAULT_WORDS;
  const deskMat = useDesk();
  const cardTex = useCardTextures(words, props.title ?? 'RECOVERY PHRASE');
  const keyMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#e8b64a', metalness: 1, roughness: 0.22, emissive: new THREE.Color('#8a5a10'), emissiveIntensity: 0.35}), []);

  const cardIn = has('card') ? p('card', 22, Easing.out(Easing.cubic)) : 1;
  const writeP = has('write') ? p('write', props.dur ?? 36, Easing.linear) : has('pick') ? p('pick', 40, Easing.linear) : props.blank ? 0 : 1;
  const nWritten = Math.floor(writeP * 12 + 0.001);
  const lit = Math.max(props.wordsLit ? 1 : 0, p('glow', 14));
  const keyP = p('key', 26, Easing.out(Easing.back(1.4)));
  const wallP = p('wall', 24);
  const pickP = p('pick', 40, Easing.linear);
  const devIn = has('device') ? p('device', 22, Easing.out(Easing.cubic)) : props.device ? 1 : 0;
  const restoreP = p('restore', 24);
  const copyP = p('copy', 40, Easing.inOut(Easing.quad));
  const twoP = p('two', 26, Easing.out(Easing.cubic));
  const faded = copyP;

  const tex = cardTex(nWritten, lit, faded);
  const flyTex = useMemo(() => words.map((w) => wordTex(w, RED)), [words]);
  const pickTex = useMemo(() => words.map((w) => wordTex(w, AMBER)), [words]);

  // wall of 2,048 tiles (instanced), with 12 lit ones that fly to the card on `pick`
  const wallGeo = useMemo(() => new THREE.PlaneGeometry(0.088, 0.036), []);
  const wallMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#2b5f8a', transparent: true, opacity: 0.8, toneMapped: false}), []);
  const picks = useMemo(() => Array.from({length: 12}, (_, i) => Math.floor(rand(i * 13.7 + 2) * WALL_COLS * WALL_ROWS)), []);
  const tilePos = (k: number): [number, number, number] => {
    const c = k % WALL_COLS;
    const r = Math.floor(k / WALL_COLS);
    return [-1.62 + c * 0.105, 0.35 + r * 0.052, -2.6];
  };
  // the canvas mounts in its own React root, so fill the instances when the mesh itself attaches
  const wallRef = React.useCallback((m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const d = new THREE.Object3D();
    for (let k = 0; k < WALL_COLS * WALL_ROWS; k++) {
      const c = k % WALL_COLS;
      const r = Math.floor(k / WALL_COLS);
      d.position.set(-1.62 + c * 0.105, 0.35 + r * 0.052, -2.6);
      d.updateMatrix();
      m.setMatrixAt(k, d.matrix);
      const v = 0.55 + rand(k) * 0.45;
      m.setColorAt(k, new THREE.Color(0.35 * v, 0.75 * v, 1.0 * v));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  const wallSweep = wallP; // reveal bottom→top via opacity
  wallMat.opacity = 0.85 * wallSweep;

  const cardX = interpolate(twoP, [0, 1], [0, -1.45]);
  const cardY = interpolate(cardIn, [0, 1], [0.9, 0]);
  const cardZ = interpolate(cardIn, [0, 1], [1.4, 0]);
  const cardRot = interpolate(cardIn, [0, 1], [-0.5, 0]);

  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.55} warm={0.25}>
      <fog attach="fog" args={['#0b1220', 8, 20]} />
      <spotLight position={[0.4, 5, 2.5]} angle={0.55} penumbra={0.8} intensity={5} distance={14} color="#fff3e0" />
      <Desk mat={deskMat} />
      {/* word wall */}
      <instancedMesh ref={wallRef} args={[wallGeo, wallMat, WALL_COLS * WALL_ROWS]} visible={wallP > 0} frustumCulled={false} />
      {wallP > 0
        ? picks.map((k, i) => {
            const t = clamp01((pickP - i / 16) * 2.2);
            const [wx, wy, wz] = tilePos(k);
            const [cx, cz] = cellPos(i);
            const tx = cardX + cx + 0.2;
            const x = interpolate(t, [0, 1], [wx, tx]);
            const y = interpolate(t, [0, 1], [wy, 0.05]) + Math.sin(t * Math.PI) * 0.6;
            const z = interpolate(t, [0, 1], [wz + 0.02, cz]);
            if (t >= 1) return null;
            return (
              <mesh key={i} position={[x, y, z]} rotation={[-(Math.PI / 2) * t, 0, 0]} scale={1 + t * 3}>
                <planeGeometry args={[0.088, 0.036]} />
                <meshBasicMaterial map={(t > 0.02 ? pickTex[i] : null) ?? undefined} color={t > 0.02 ? '#ffffff' : AMBER} transparent toneMapped={false} opacity={wallP} />
              </mesh>
            );
          })
        : null}
      {/* the card */}
      <group position={[cardX, cardY, cardZ]} rotation={[cardRot, 0, 0]}>
        <BlobShadow w={3.0} d={2.1} opacity={0.5} position={[0, -0.01, 0]} />
        <Card tex={tex} glow={lit} />
      </group>
      {twoP > 0 ? (
        <group position={[interpolate(twoP, [0, 1], [0, 1.45]), interpolate(twoP, [0, 0.5, 1], [0, 0.4, 0]), interpolate(twoP, [0, 1], [0, 0.15])]} rotation={[0, interpolate(twoP, [0, 1], [0, -0.08]), 0]}>
          <BlobShadow w={3.0} d={2.1} opacity={0.5} position={[0, -0.01, 0]} />
          <Card tex={tex} glow={lit} />
        </group>
      ) : null}
      {/* key rising out of the card */}
      {keyP > 0 ? (
        <group position={[cardX - 0.5 * keyP, 0.1 + keyP * 0.95, 0.15]} rotation={[0.3, frame * 0.03, -0.15]} scale={keyP * 0.95}>
          <Key mat={keyMat} />
          <pointLight color={AMBER} intensity={2.5 * keyP} distance={3} />
        </group>
      ) : null}
      {/* device */}
      {devIn > 0 ? (
        <group position={[interpolate(devIn, [0, 1], [4.5, 1.85]), 0.07, 0.25]} rotation={[0, -0.25, 0]}>
          <BlobShadow w={1.1} d={1.6} opacity={0.5} position={[0, -0.07, 0]} />
          <Device restored={restoreP} frame={frame} />
        </group>
      ) : null}
      {/* stolen copies fly away */}
      {copyP > 0
        ? words.map((w, i) => {
            const t = clamp01((copyP - i / 30) * 1.4);
            const [cx, cz] = cellPos(i);
            const x = cardX + cx + 0.2 + t * (-2.4 + rand(i) * 1.2);
            const y = 0.06 + t * (2.2 + rand(i + 4) * 1.4);
            const z = cz + t * (0.8 + rand(i + 9));
            return (
              <mesh key={w + i} position={[x, y, z]} rotation={[-(Math.PI / 2) * (1 - t), 0, 0]} scale={1 + t * 0.5}>
                <planeGeometry args={[0.62, 0.19]} />
                <meshBasicMaterial map={flyTex[i] ?? undefined} transparent toneMapped={false} opacity={Math.min(1, t * 4) * (1 - clamp01((t - 0.85) * 6))} depthWrite={false} />
              </mesh>
            );
          })
        : null}
    </Studio>
  );
};

// ---------- Letter3D ----------
const QR_N = 25;
const drawQR = (g: CanvasRenderingContext2D, x0: number, y0: number, size: number) => {
  const c = size / QR_N;
  g.fillStyle = '#ffffff';
  g.fillRect(x0 - c, y0 - c, size + 2 * c, size + 2 * c);
  g.fillStyle = '#111111';
  for (let r = 0; r < QR_N; r++)
    for (let k = 0; k < QR_N; k++) {
      const finder = (r < 7 && k < 7) || (r < 7 && k >= QR_N - 7) || (r >= QR_N - 7 && k < 7);
      if (finder) continue;
      if (rand(r * 31 + k * 7 + 3) > 0.52) g.fillRect(x0 + k * c, y0 + r * c, c + 0.5, c + 0.5);
    }
  const fp = (fx: number, fy: number) => {
    g.fillStyle = '#111';
    g.fillRect(x0 + fx * c, y0 + fy * c, 7 * c, 7 * c);
    g.fillStyle = '#fff';
    g.fillRect(x0 + (fx + 1) * c, y0 + (fy + 1) * c, 5 * c, 5 * c);
    g.fillStyle = '#111';
    g.fillRect(x0 + (fx + 2) * c, y0 + (fy + 2) * c, 3 * c, 3 * c);
  };
  fp(0, 0);
  fp(QR_N - 7, 0);
  fp(0, QR_N - 7);
};

const LET_W = 1.7;
const LET_H = 2.3;
const drawLetter = (g: CanvasRenderingContext2D, deadline: string, label = 'COMPLETE BY') => {
  const W = 850;
  const H = 1150;
  g.fillStyle = '#fbfbf8';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#20242c';
  g.fillRect(0, 0, W, 16);
  g.fillStyle = '#20242c';
  g.font = `800 50px ${FONT}`;
  g.fillText('IMPORTANT NOTICE', 60, 110);
  g.fillStyle = '#6b7280';
  g.font = `600 26px ${FONT}`;
  g.fillText('Ref. 2025/04-7731 · Security Department', 60, 152);
  g.fillStyle = '#20242c';
  g.font = `700 32px ${FONT}`;
  g.fillText('Mandatory wallet validation', 60, 230);
  for (let i = 0; i < 9; i++) {
    g.fillStyle = '#c3c7ce';
    g.fillRect(60, 280 + i * 34, 520 + rand(i + 2) * 200, 12);
  }
  // deadline box
  g.strokeStyle = '#c0392b';
  g.lineWidth = 5;
  g.strokeRect(60, 620, 430, 120);
  g.fillStyle = '#c0392b';
  g.font = `800 30px ${FONT}`;
  g.fillText(label, 86, 670);
  g.font = `800 44px ${FONT}`;
  g.fillText(deadline, 86, 722);
  drawQR(g, 560, 610, 220);
  g.fillStyle = '#6b7280';
  g.font = `600 22px ${FONT}`;
  g.fillText('Scan to begin', 600, 870);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = '#d3d6dc';
    g.fillRect(60, 930 + i * 32, 380 + rand(i + 20) * 160, 11);
  }
  // hologram seal
  const grd = g.createLinearGradient(640, 940, 790, 1090);
  ['#9be7ff', '#f6a6ff', '#fff59b', '#a6ffcb'].forEach((c, i) => grd.addColorStop(i / 3, c));
  g.fillStyle = grd;
  g.beginPath();
  g.arc(715, 1015, 72, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.8)';
  g.lineWidth = 3;
  for (let r = 20; r < 70; r += 12) {
    g.beginPath();
    g.arc(715, 1015, r, 0, Math.PI * 2);
    g.stroke();
  }
};

const drawPhone = (g: CanvasRenderingContext2D, n: number, words: string[], stolen: boolean) => {
  const W = 480;
  const H = 980;
  g.fillStyle = '#f4f6f9';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e1e5eb';
  g.fillRect(0, 0, W, 90);
  g.fillStyle = '#8a94a3';
  g.font = `600 22px ${FONT}`;
  g.fillText('🔒 wallet-validation-check.io', 34, 58);
  g.fillStyle = '#1b2230';
  g.font = `800 38px ${FONT}`;
  g.fillText('Verify your wallet', 34, 160);
  g.fillStyle = '#6b7280';
  g.font = `600 22px ${FONT}`;
  g.fillText('Enter your recovery phrase', 34, 198);
  for (let i = 0; i < 12; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 34 + col * 214;
    const y = 240 + row * 86;
    g.fillStyle = '#ffffff';
    g.fillRect(x, y, 196, 64);
    g.strokeStyle = i < n ? (stolen ? RED : '#2f7cf6') : '#c9cfd8';
    g.lineWidth = 3;
    g.strokeRect(x, y, 196, 64);
    g.fillStyle = '#9aa3b0';
    g.font = `700 20px ${FONT}`;
    g.fillText(String(i + 1), x + 12, y + 40);
    if (i < n) {
      g.fillStyle = '#1b2230';
      g.font = `700 28px ${FONT}`;
      g.fillText(words[i], x + 44, y + 42);
    }
  }
  g.fillStyle = stolen ? RED : '#2f7cf6';
  g.fillRect(34, 790, 412, 80);
  g.fillStyle = '#fff';
  g.font = `800 32px ${FONT}`;
  g.textAlign = 'center';
  g.fillText(stolen ? 'Sent ✓' : 'Validate', 240, 842);
};

type LetP = {actions?: string[]; cam?: Cam[]; tags?: Tag[]; caption?: string; deadline?: string; deadlineLabel?: string; opened?: boolean; phone?: boolean; words?: string[]};

export const Letter3D: React.FC<SceneProps<LetP>> = ({props, beats, durationInFrames}) => {
  const acts = props.actions ?? [];
  const {frame, p, has} = useClock(beats, acts);
  const cam = useCamera(props.cam, beats, durationInFrames, {beat: -1, pos: [0, 4.6, 4.0], look: [0, 0, 0.2], fov: 36});
  const words = props.words ?? DEFAULT_WORDS;
  const deskMat = useDesk();
  const letterTex = useMemo(() => canvasTex(850, 1150, (g) => drawLetter(g, props.deadline ?? 'MANDATORY', props.deadlineLabel)), [props.deadline, props.deadlineLabel]);
  const envTex = useMemo(
    () =>
      canvasTex(800, 480, (g) => {
        g.fillStyle = '#ece6da';
        g.fillRect(0, 0, 800, 480);
        g.fillStyle = '#5b6270';
        g.font = `600 30px ${FONT}`;
        for (let i = 0; i < 3; i++) {
          g.fillStyle = '#9097a3';
          g.fillRect(330, 250 + i * 40, 280 - i * 30, 14);
        }
        g.strokeStyle = '#b9b2a2';
        g.lineWidth = 3;
        g.strokeRect(640, 30, 120, 140);
        g.fillStyle = '#c7cfe0';
        g.fillRect(650, 40, 100, 120);
      }),
    [],
  );
  const phoneCache = useMemo(() => new Map<string, THREE.Texture | null>(), []);
  const phoneTex = (n: number, stolen: boolean) => {
    const k = `${n}|${stolen}`;
    if (!phoneCache.has(k)) phoneCache.set(k, canvasTex(480, 980, (g) => drawPhone(g, n, words, stolen)));
    return phoneCache.get(k) ?? null;
  };
  const flyTex = useMemo(() => words.map((w) => wordTex(w, RED)), [words]);
  const phoneGeo = useMemo(() => new RoundedBoxGeometry(0.98, 2.0, 0.09, 6, 0.12), []);

  const arriveP = has('arrive') ? p('arrive', 22, Easing.out(Easing.bounce)) : 1;
  const openP = props.opened ? 1 : p('open', 30);
  const qrP = p('qr', 30, Easing.linear);
  const stampP = p('deadline', 10, Easing.in(Easing.quad));
  const siteP = props.phone ? 1 : p('site', 24, Easing.out(Easing.cubic));
  const typeP = p('type', 34, Easing.linear);
  const stealP = p('steal', 40, Easing.inOut(Easing.quad));
  const nTyped = props.phone && !has('type') ? 12 : Math.floor(typeP * 12 + 0.001);
  const stolen = stealP > 0.05;

  // envelope transforms
  const envY = interpolate(arriveP, [0, 1], [2.6, 0.02]);
  const envRot = interpolate(arriveP, [0, 1], [0.9, 0]);
  const flap = interpolate(openP, [0, 0.4], [0, Math.PI * 0.92], {extrapolateRight: 'clamp'});
  const slide = interpolate(openP, [0.3, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const letX = 0;
  const letZ = interpolate(slide, [0, 1], [-0.75, 0.55]);
  const letY = interpolate(slide, [0, 0.5, 1], [0.03, 0.35, 0.05]);
  const letS = interpolate(slide, [0, 1], [0.7, 1]);

  const tagShow = (props.tags ?? []).map((_, i) => p(`label:${i}`, 10, Easing.out(Easing.back(1.5))));
  const overlay = (
    <>
      <Tags tags={props.tags ?? []} show={tagShow} />
      {props.caption ? <Caption text={props.caption} /> : null}
    </>
  );

  // QR sits at letter-local (approx) x 0.32..0.76, z -0.15..+0.30 of the 1.7×2.3 sheet
  const qrX = (670 / 850 - 0.5) * LET_W;
  const qrZ = (720 / 1150 - 0.5) * LET_H;

  return (
    <Studio cam={cam} overlay={overlay} bloom={0.55} warm={0.2}>
      <fog attach="fog" args={['#0b1220', 8, 20]} />
      <spotLight position={[0.3, 5.5, 2.6]} angle={0.55} penumbra={0.8} intensity={5} distance={14} color="#fff3e0" />
      <Desk mat={deskMat} />
      {/* envelope */}
      <group position={[0, envY, -1.0]} rotation={[0, envRot, envRot * 0.3]}>
        <BlobShadow w={2.6} d={1.7} opacity={0.45} position={[0, -0.02, 0]} />
        <mesh>
          <boxGeometry args={[2.3, 0.03, 1.4]} />
          <meshStandardMaterial color="#e4ddcf" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.28, 1.38]} />
          <meshStandardMaterial map={envTex ?? undefined} roughness={0.9} />
        </mesh>
        {/* flap hinged on the far edge */}
        <group position={[0, 0.035, -0.7]} rotation={[-flap, 0, 0]}>
          <mesh position={[0, 0, 0.42]} rotation={[-Math.PI / 2, 0, Math.PI]}>
            <circleGeometry args={[1.15, 3, Math.PI / 2 - Math.PI / 3, (Math.PI * 2) / 3]} />
            <meshStandardMaterial color="#d9d1c0" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      {/* letter */}
      {openP > 0.25 || props.opened ? (
        <group position={[letX, letY, letZ]} scale={letS} rotation={[0, 0.04, 0]}>
          <BlobShadow w={2.0} d={2.6} opacity={0.4} position={[0, -0.01, 0]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[LET_W, LET_H]} />
            <meshStandardMaterial map={letterTex ?? undefined} roughness={0.85} />
          </mesh>
          {/* QR scan beam */}
          {qrP > 0 && qrP < 1 ? (
            <mesh position={[qrX, 0.03, qrZ - 0.26 + qrP * 0.52]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.62, 0.035]} />
              <meshBasicMaterial color={CYAN} transparent opacity={0.9} toneMapped={false} />
            </mesh>
          ) : null}
          {qrP > 0 ? (
            <mesh position={[qrX, 0.012, qrZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.36, 0.39, 4, 1, Math.PI / 4]} />
              <meshBasicMaterial color={CYAN} transparent opacity={Math.min(1, qrP * 3) * (0.6 + 0.4 * Math.sin(frame / 4) ** 2)} toneMapped={false} />
            </mesh>
          ) : null}
          {/* DEADLINE stamp */}
          {stampP > 0 ? <Stamp p={stampP} /> : null}
        </group>
      ) : null}
      {/* phone with the fake page */}
      {siteP > 0 ? (
        <group position={[interpolate(siteP, [0, 1], [3.2, 1.25]), interpolate(siteP, [0, 1], [-0.4, 1.05]), 1.25]} rotation={[-0.75, -0.28, 0.06]}>
          <mesh geometry={phoneGeo}>
            <meshPhysicalMaterial color="#111317" metalness={0.6} roughness={0.3} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0, 0.047]}>
            <planeGeometry args={[0.9, 1.84]} />
            <meshBasicMaterial map={phoneTex(nTyped, stolen) ?? undefined} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
      {stealP > 0
        ? words.map((w, i) => {
            const t = clamp01((stealP - i / 30) * 1.4);
            const x = 1.25 + t * (-3.6 - rand(i) * 1.5);
            const y = 1.05 + t * (1.0 + rand(i + 3) * 1.6) + (i % 4) * 0.08;
            const z = 1.4 + t * (rand(i + 6) - 0.5);
            return (
              <mesh key={i} position={[x, y, z]} rotation={[-0.75 * (1 - t), 0, 0]} scale={0.8 + t * 0.6}>
                <planeGeometry args={[0.62, 0.19]} />
                <meshBasicMaterial map={flyTex[i] ?? undefined} transparent toneMapped={false} opacity={Math.min(1, t * 5) * (1 - clamp01((t - 0.85) * 6))} depthWrite={false} />
              </mesh>
            );
          })
        : null}
    </Studio>
  );
};

const Stamp: React.FC<{p: number}> = ({p}) => {
  const tex = useMemo(
    () =>
      canvasTex(520, 180, (g) => {
        g.clearRect(0, 0, 520, 180);
        g.strokeStyle = RED;
        g.lineWidth = 12;
        g.strokeRect(14, 14, 492, 152);
        g.fillStyle = RED;
        g.font = `900 92px ${FONT}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('DEADLINE', 260, 94);
      }),
    [],
  );
  const s = interpolate(p, [0, 1], [2.2, 1]);
  return (
    <mesh position={[-0.2, 0.02 + (1 - p) * 0.8, -0.35]} rotation={[-Math.PI / 2, 0, 0.22]} scale={s}>
      <planeGeometry args={[1.1, 0.38]} />
      <meshBasicMaterial map={tex ?? undefined} transparent opacity={0.92 * p} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};
