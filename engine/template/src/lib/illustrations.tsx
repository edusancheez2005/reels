import React from 'react';

/**
 * Original flat illustrations for explainer scenes. All are plain SVG groups drawn in their own
 * viewBox so scenes can place/scale them. Keep them generic (no brands, no characters from media).
 */

/** Atlantic cod, facing right. viewBox 0 0 400 170. `frost` 0–1 adds ice; `cut` 0–1 splits into two fillets. */
export const Cod: React.FC<{frost?: number; cut?: number; id?: string}> = ({frost = 0, cut = 0, id = 'cod'}) => {
  const split = cut * 26;
  const body = 'M34 86 C70 44 150 30 236 32 C306 34 356 54 388 84 C360 110 306 126 236 128 C152 130 74 120 34 86 Z';
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A6A3E" />
          <stop offset="0.45" stopColor="#A89466" />
          <stop offset="0.7" stopColor="#E9E1C8" />
          <stop offset="1" stopColor="#F6F1E2" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={body} />
        </clipPath>
      </defs>
      <g transform={`translate(0 ${-split})`}>
        {/* tail */}
        <path d="M44 86 L4 46 C14 70 16 80 14 86 C16 92 14 102 4 126 Z" fill="#7F6F43" />
        {/* dorsal fins */}
        <path d="M150 38 C158 16 176 10 190 34 Z" fill="#6E5F36" />
        <path d="M204 33 C214 8 238 4 252 32 Z" fill="#6E5F36" />
        <path d="M268 36 C278 14 300 12 312 42 Z" fill="#6E5F36" />
      </g>
      <g transform={`translate(0 ${split})`}>
        <path d="M206 126 C214 150 236 152 250 126 Z" fill="#8A7A4C" />
        <path d="M268 122 C278 144 298 146 310 118 Z" fill="#8A7A4C" />
      </g>
      {/* body (top half lifts, bottom half drops when cut) */}
      <g clipPath={`url(#${id}-clip)`}>
        <g transform={`translate(0 ${-split})`}>
          <rect x="0" y="0" width="400" height="84" fill={`url(#${id}-g)`} />
          {[70, 110, 150, 190, 230, 270, 310].map((x, i) => (
            <circle key={i} cx={x + (i % 2) * 12} cy={52 + (i % 3) * 8} r={4 + (i % 2)} fill="#5C4E2A" opacity={0.55} />
          ))}
        </g>
        <g transform={`translate(0 ${split})`}>
          <rect x="0" y="84" width="400" height="100" fill={`url(#${id}-g)`} />
        </g>
      </g>
      {cut > 0.05 ? (
        <>
          <path d="M40 84 L388 84" stroke="#F2D6C9" strokeWidth={3 + cut * 10} transform={`translate(0 ${-split + 2})`} opacity={cut} />
          <path d="M40 84 L388 84" stroke="#F2D6C9" strokeWidth={3 + cut * 10} transform={`translate(0 ${split - 2})`} opacity={cut} />
        </>
      ) : null}
      {/* lateral line, head */}
      <g transform={`translate(0 ${-split})`}>
        <path d="M60 82 C150 70 260 66 336 72" stroke="#F4EEDB" strokeWidth={3} fill="none" opacity={0.8} />
        <path d="M322 46 C330 70 332 96 324 116" stroke="#5C4E2A" strokeWidth={2.5} fill="none" opacity={0.5} />
        <circle cx={350} cy={70} r={8} fill="#fff" />
        <circle cx={352} cy={70} r={4.5} fill="#1B1B1B" />
        <path d="M372 92 C378 94 384 92 388 88" stroke="#5C4E2A" strokeWidth={2.5} fill="none" />
      </g>
      <path d="M362 112 C364 120 366 126 362 132" stroke="#5C4E2A" strokeWidth={2.5} fill="none" transform={`translate(0 ${split})`} />
      <path d="M300 96 C312 104 316 112 306 118 C298 112 296 104 300 96 Z" fill="#9C8B5A" transform={`translate(0 ${split})`} />
      {/* frost */}
      {frost > 0 ? (
        <g opacity={frost}>
          <path d={body} fill="rgba(170,210,255,0.55)" />
          {Array.from({length: 26}).map((_, i) => {
            const x = 50 + ((i * 53) % 330);
            const y = 48 + ((i * 37) % 76);
            const r = 5 + (i % 4) * 3;
            return (
              <g key={i} stroke="#fff" strokeWidth={2} opacity={0.9}>
                <line x1={x - r} y1={y} x2={x + r} y2={y} />
                <line x1={x} y1={y - r} x2={x} y2={y + r} />
                <line x1={x - r * 0.7} y1={y - r * 0.7} x2={x + r * 0.7} y2={y + r * 0.7} />
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

/** Stern trawler, facing right. viewBox 0 0 380 230. */
export const Trawler: React.FC = () => (
  <g>
    <path d="M10 150 L370 150 L340 205 L50 205 Z" fill="#B3262E" />
    <path d="M10 150 L370 150 L364 166 L18 166 Z" fill="#1F2A44" />
    <rect x="200" y="78" width="110" height="72" rx="6" fill="#F3F4F6" />
    <rect x="212" y="90" width="22" height="18" rx="3" fill="#7DD3FC" />
    <rect x="242" y="90" width="22" height="18" rx="3" fill="#7DD3FC" />
    <rect x="272" y="90" width="22" height="18" rx="3" fill="#7DD3FC" />
    <rect x="236" y="54" width="44" height="26" rx="4" fill="#E5E7EB" />
    <line x1="258" y1="54" x2="258" y2="10" stroke="#374151" strokeWidth="5" />
    <line x1="238" y1="26" x2="278" y2="26" stroke="#374151" strokeWidth="4" />
    {/* stern gantry */}
    <path d="M40 150 L60 70 L90 70 L100 150" fill="none" stroke="#F59E0B" strokeWidth="9" strokeLinejoin="round" />
    <line x1="60" y1="70" x2="258" y2="12" stroke="#4B5563" strokeWidth="2.5" />
    <rect x="290" y="132" width="60" height="18" fill="#F3F4F6" />
    <text x="120" y="190" fontFamily="Inter, sans-serif" fontWeight={800} fontSize={20} fill="#fff" opacity={0.85}>
      PD 1
    </text>
  </g>
);

/** Container ship, facing right. viewBox 0 0 420 170. */
export const CargoShip: React.FC = () => {
  const colors = ['#E11D48', '#2563EB', '#F59E0B', '#16A34A', '#7C3AED', '#0EA5E9'];
  return (
    <g>
      <path d="M8 104 L412 104 L384 160 L36 160 Z" fill="#1E293B" />
      <path d="M22 140 L398 140 L384 160 L36 160 Z" fill="#B91C1C" />
      {Array.from({length: 3}).map((_, r) =>
        Array.from({length: 9}).map((__, c) => (
          <rect key={`${r}-${c}`} x={70 + c * 30} y={80 - r * 22} width={28} height={20} rx={2} fill={colors[(r * 4 + c * 3) % colors.length]} />
        )),
      )}
      <rect x="20" y="40" width="40" height="64" rx="4" fill="#F1F5F9" />
      <rect x="26" y="48" width="28" height="10" rx="2" fill="#38BDF8" />
      <rect x="34" y="20" width="8" height="22" fill="#334155" />
    </g>
  );
};

/** Shipping container with doors. viewBox 0 0 300 150. `doors` 0 = open, 1 = shut. */
export const Container: React.FC<{doors?: number; color?: string; label?: string}> = ({doors = 1, color = '#2563EB', label}) => (
  <g>
    <rect x="0" y="0" width="300" height="150" rx="6" fill={color} />
    {Array.from({length: 14}).map((_, i) => (
      <rect key={i} x={10 + i * 20} y="10" width="9" height="130" rx="2" fill="rgba(0,0,0,0.16)" />
    ))}
    <rect x="0" y="0" width="300" height="12" fill="rgba(0,0,0,0.2)" />
    {/* doors on the right end, drawn as two panels swinging */}
    <g transform={`translate(300 0)`}>
      <rect x={-70 * doors} y="6" width={70 * doors} height="138" fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth="3" />
      {doors > 0.6 ? (
        <>
          <line x1={-35 * doors} y1="10" x2={-35 * doors} y2="140" stroke="rgba(0,0,0,0.4)" strokeWidth="3" />
          <rect x={-22} y="60" width="6" height="30" rx="2" fill="#E5E7EB" />
          <rect x={-50} y="60" width="6" height="30" rx="2" fill="#E5E7EB" />
        </>
      ) : null}
    </g>
    {label ? (
      <text x="120" y="88" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="24" fontWeight={700} fill="#fff" opacity={0.9}>
        {label}
      </text>
    ) : null}
  </g>
);

/**
 * A processing worker at a steel table (generic character, original drawing). viewBox 0 0 520 460.
 * `arm` = knife-arm angle in degrees, `look` -1..1 head tilt, children are drawn on the table (the fish).
 */
export const Worker: React.FC<{arm?: number; look?: number; blink?: boolean; children?: React.ReactNode}> = ({arm = 0, look = 0, blink = false, children}) => (
  <g>
    {/* body */}
    <path d="M190 250 C190 196 222 172 260 172 C298 172 330 196 330 250 L330 330 L190 330 Z" fill="#2B6CB0" />
    <path d="M214 214 L306 214 L314 330 L206 330 Z" fill="#F8FAFC" />
    <line x1="230" y1="214" x2="226" y2="190" stroke="#F8FAFC" strokeWidth="6" />
    <line x1="290" y1="214" x2="294" y2="190" stroke="#F8FAFC" strokeWidth="6" />
    {/* head */}
    <g transform={`rotate(${look * 6} 260 130)`}>
      <circle cx="260" cy="128" r="46" fill="#E9B98F" />
      <path d="M212 118 C214 82 240 70 262 70 C288 70 310 84 310 118 C296 104 228 104 212 118 Z" fill="#E2E8F0" />
      <path d="M212 118 C230 108 292 108 310 118" stroke="#CBD5E1" strokeWidth="4" fill="none" />
      {blink ? (
        <>
          <line x1="240" y1="134" x2="252" y2="134" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
          <line x1="270" y1="134" x2="282" y2="134" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="246" cy="134" r="5" fill="#1F2937" />
          <circle cx="276" cy="134" r="5" fill="#1F2937" />
        </>
      )}
      <path d="M248 152 C256 158 266 158 274 152" stroke="#9A5B3C" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* face mask strap hint */}
      <circle cx="226" cy="140" r="6" fill="#DFA97F" />
    </g>
    {/* holding arm (left) */}
    <path d="M200 236 C176 270 170 300 186 330" stroke="#2B6CB0" strokeWidth="30" fill="none" strokeLinecap="round" />
    <circle cx="190" cy="336" r="17" fill="#FACC15" />
    {/* table */}
    <rect x="40" y="330" width="440" height="22" rx="6" fill="#CBD5E1" />
    <rect x="40" y="352" width="440" height="10" fill="#94A3B8" />
    <rect x="70" y="362" width="16" height="96" fill="#94A3B8" />
    <rect x="434" y="362" width="16" height="96" fill="#94A3B8" />
    {/* what's on the table */}
    <g>{children}</g>
    {/* knife arm (right), rotates at the shoulder */}
    <g transform={`rotate(${arm} 316 222)`}>
      <path d="M316 222 C350 250 362 282 352 312" stroke="#2B6CB0" strokeWidth="30" fill="none" strokeLinecap="round" />
      <circle cx="350" cy="318" r="17" fill="#FACC15" />
      <rect x="344" y="300" width="12" height="34" rx="4" fill="#1F2937" transform="rotate(-70 350 318)" />
      <path d="M330 326 L262 342 L330 334 Z" fill="#E5E7EB" stroke="#94A3B8" strokeWidth="2" transform="rotate(-8 330 330)" />
    </g>
  </g>
);

/** Fish and chips in a paper tray. viewBox 0 0 420 300. */
export const FishChips: React.FC = () => (
  <g>
    <path d="M40 150 L380 150 L346 286 L74 286 Z" fill="#F5F0E1" stroke="#D6CBB0" strokeWidth="4" />
    {[176, 204, 232, 260].map((y) => (
      <line key={y} x1={70 + (y - 150) * 0.25} y1={y} x2={350 - (y - 150) * 0.25} y2={y} stroke="#CFC4A6" strokeWidth="3" opacity={0.6} />
    ))}
    {Array.from({length: 11}).map((_, i) => (
      <rect key={i} x={70 + i * 22} y={92 + (i % 3) * 10} width={20} height={70 + (i % 4) * 8} rx={6} fill={i % 2 ? '#F6C453' : '#EFB43A'} transform={`rotate(${(i - 5) * 4} ${80 + i * 22} 160)`} />
    ))}
    <path d="M60 120 C100 60 250 40 340 70 C380 84 392 110 360 126 C290 156 120 160 60 120 Z" fill="#D9932F" />
    <path d="M90 104 C150 74 260 66 330 84" stroke="#F2C26B" strokeWidth="8" fill="none" strokeLinecap="round" opacity={0.8} />
    {Array.from({length: 14}).map((_, i) => (
      <circle key={i} cx={90 + ((i * 41) % 250)} cy={86 + ((i * 23) % 40)} r={4} fill="#B8741F" opacity={0.6} />
    ))}
    <path d="M330 112 C360 96 390 108 388 134 C364 140 340 132 330 112 Z" fill="#FDE047" stroke="#EAB308" strokeWidth="3" />
  </g>
);
