import Link from 'next/link'
import { Logo } from '@/components/Logo'

// ─── Isometric layers SVG ─────────────────────────────────────────────────────

function IsometricLayers() {
  // Isometric platform: top face + right face + left face
  // hw=75 hd=38 sideH=15 gap=58
  const cx = 130
  const hw = 75
  const hd = 38
  const h = 15
  const gap = 58

  const layer = (apexY: number) => {
    const top = `${cx},${apexY}`
    const right = `${cx + hw},${apexY + hd}`
    const bottom = `${cx},${apexY + 2 * hd}`
    const left = `${cx - hw},${apexY + hd}`
    const rfTL = `${cx + hw},${apexY + hd}`
    const rfBL = `${cx},${apexY + 2 * hd}`
    const rfBR = `${cx},${apexY + 2 * hd + h}`
    const rfTR = `${cx + hw},${apexY + hd + h}`
    const lfTR = `${cx - hw},${apexY + hd}`
    const lfBR = `${cx},${apexY + 2 * hd}`
    const lfBL = `${cx},${apexY + 2 * hd + h}`
    const lfTL = `${cx - hw},${apexY + hd + h}`
    return { topFace: `${top} ${right} ${bottom} ${left}`, rightFace: `${rfTL} ${rfBL} ${rfBR} ${rfTR}`, leftFace: `${lfTR} ${lfBR} ${lfBL} ${lfTL}` }
  }

  const apices = [10, 10 + gap, 10 + gap * 2, 10 + gap * 3]
  const stroke = 'rgba(255,255,255,0.35)'
  const topOpacities = [0.12, 0.09, 0.07, 0.05]
  const sideOpacities = [0.18, 0.14, 0.10, 0.07]
  const numberCenterY = apices.map(a => a + hd)

  return (
    <svg viewBox="0 0 260 295" width="260" height="295" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F2B26B" />
          <stop offset="100%" stopColor="#E0875A" />
        </linearGradient>
      </defs>
      {/* Draw bottom to top so upper layers appear on top */}
      {[3, 2, 1, 0].map((i) => {
        const { topFace, rightFace, leftFace } = layer(apices[i])
        const isTop = i === 0
        return (
          <g key={i}>
            {/* Left face */}
            <polygon points={leftFace} fill={`rgba(255,255,255,${sideOpacities[i] * 0.7})`} stroke={stroke} strokeWidth="0.8" />
            {/* Right face */}
            <polygon points={rightFace} fill={`rgba(255,255,255,${sideOpacities[i]})`} stroke={stroke} strokeWidth="0.8" />
            {/* Top face */}
            <polygon points={topFace} fill={isTop ? 'url(#topGrad)' : `rgba(255,255,255,${topOpacities[i]})`} stroke={stroke} strokeWidth="0.8" />
            {/* Number label */}
            <text
              x={cx}
              y={numberCenterY[i] + 5}
              textAnchor="middle"
              fill={isTop ? '#0B1020' : 'rgba(255,255,255,0.55)'}
              fontSize="14"
              fontFamily="serif"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Hero SVG ─────────────────────────────────────────────────────────────────

function CitySilhouette() {
  const buildingColor = '#0A0F1A'
  const windowColor = '#F2C470'
  const craneBg = '#0A0F1A'

  return (
    <svg
      viewBox="0 0 1440 300"
      preserveAspectRatio="xMidYMax meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-auto"
    >
      {/* ── Stars ───────────────────────────────────────────────────────────── */}
      {[
        [80,18,1.2,0.9],[180,32,1,0.6],[310,12,1.5,0.8],[420,24,1,0.5],
        [540,16,1.3,0.9],[680,8,1,0.7],[750,30,1.2,0.6],[900,15,1,0.8],
        [1020,26,1.4,0.5],[1150,10,1,0.9],[1260,22,1.2,0.7],[1370,35,1,0.6],
        [130,55,0.8,0.5],[460,48,0.8,0.6],[820,52,0.9,0.4],[1100,45,0.8,0.7],
      ].map(([cx, cy, r, op], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={op} />
      ))}

      {/* ── Far background buildings (lighter) ──────────────────────────────── */}
      <rect x="0" y="210" width="55" height="90" fill="#0D1525" />
      <rect x="60" y="225" width="40" height="75" fill="#0D1525" />
      <rect x="1340" y="218" width="60" height="82" fill="#0D1525" />
      <rect x="1390" y="230" width="50" height="70" fill="#0D1525" />

      {/* ── Main buildings ──────────────────────────────────────────────────── */}

      {/* Far left block */}
      <rect x="0" y="175" width="70" height="125" fill={buildingColor} />
      <rect x="15" y="185" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="28" y="185" width="8" height="6" fill={windowColor} opacity="0.7" />
      <rect x="41" y="185" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="15" y="198" width="8" height="6" fill={windowColor} opacity="0.5" />
      <rect x="28" y="198" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="41" y="198" width="8" height="6" fill={windowColor} opacity="0.4" />
      <rect x="15" y="211" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="41" y="211" width="8" height="6" fill={windowColor} opacity="0.6" />

      {/* Narrow tower */}
      <rect x="78" y="148" width="42" height="152" fill={buildingColor} />
      <rect x="86" y="158" width="7" height="5" fill={windowColor} opacity="0.9" />
      <rect x="98" y="158" width="7" height="5" fill={windowColor} opacity="0.6" />
      <rect x="86" y="170" width="7" height="5" fill={windowColor} opacity="0.8" />
      <rect x="98" y="170" width="7" height="5" fill={windowColor} opacity="0.9" />
      <rect x="86" y="182" width="7" height="5" fill={windowColor} opacity="0.4" />
      <rect x="98" y="182" width="7" height="5" fill={windowColor} opacity="0.7" />
      <rect x="86" y="194" width="7" height="5" fill={windowColor} opacity="0.9" />
      <rect x="98" y="194" width="7" height="5" fill={windowColor} opacity="0.5" />
      <rect x="86" y="206" width="7" height="5" fill={windowColor} opacity="0.6" />

      {/* Stepped block */}
      <rect x="128" y="195" width="90" height="105" fill={buildingColor} />
      <rect x="145" y="175" width="55" height="125" fill={buildingColor} />
      <rect x="135" y="205" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="150" y="182" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="165" y="182" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="180" y="182" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="150" y="196" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="165" y="196" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="180" y="196" width="9" height="7" fill={windowColor} opacity="0.4" />
      <rect x="150" y="210" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="165" y="210" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="180" y="210" width="9" height="7" fill={windowColor} opacity="0.9" />

      {/* Wide low block */}
      <rect x="226" y="220" width="110" height="80" fill={buildingColor} />
      <rect x="237" y="230" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="252" y="230" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="267" y="230" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="282" y="230" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="297" y="230" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="237" y="244" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="267" y="244" width="9" height="7" fill={windowColor} opacity="0.4" />
      <rect x="297" y="244" width="9" height="7" fill={windowColor} opacity="0.7" />

      {/* Slim mid tower */}
      <rect x="344" y="160" width="48" height="140" fill={buildingColor} />
      <rect x="352" y="170" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="366" y="170" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="352" y="182" width="8" height="6" fill={windowColor} opacity="0.5" />
      <rect x="366" y="182" width="8" height="6" fill={windowColor} opacity="0.7" />
      <rect x="352" y="194" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="366" y="194" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="352" y="206" width="8" height="6" fill={windowColor} opacity="0.4" />
      <rect x="366" y="206" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="352" y="218" width="8" height="6" fill={windowColor} opacity="0.7" />
      <rect x="366" y="218" width="8" height="6" fill={windowColor} opacity="0.6" />

      {/* Medium office block */}
      <rect x="400" y="188" width="85" height="112" fill={buildingColor} />
      <rect x="412" y="198" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="427" y="198" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="442" y="198" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="457" y="198" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="412" y="212" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="442" y="212" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="412" y="226" width="9" height="7" fill={windowColor} opacity="0.4" />
      <rect x="427" y="226" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="457" y="226" width="9" height="7" fill={windowColor} opacity="0.9" />

      {/* ── CONSTRUCTION BUILDING (center hero) ─────────────────────────────── */}
      {/* Main body */}
      <rect x="490" y="115" width="165" height="185" fill={buildingColor} />
      {/* Scaffolding lines */}
      <line x1="490" y1="145" x2="655" y2="145" stroke="#131D2E" strokeWidth="2" />
      <line x1="490" y1="175" x2="655" y2="175" stroke="#131D2E" strokeWidth="2" />
      <line x1="490" y1="205" x2="655" y2="205" stroke="#131D2E" strokeWidth="2" />
      <line x1="530" y1="115" x2="530" y2="300" stroke="#131D2E" strokeWidth="2" />
      <line x1="573" y1="115" x2="573" y2="300" stroke="#131D2E" strokeWidth="2" />
      <line x1="614" y1="115" x2="614" y2="300" stroke="#131D2E" strokeWidth="2" />
      {/* Lit windows — many on the construction building */}
      {[
        [500,122,10,8],[515,122,10,8],[530,122,10,8],[545,122,10,8],[560,122,10,8],
        [575,122,10,8],[590,122,10,8],[605,122,10,8],[620,122,10,8],[635,122,10,8],
        [500,136,10,8],[515,136,10,8],[545,136,10,8],[575,136,10,8],[605,136,10,8],[635,136,10,8],
        [500,150,10,8],[530,150,10,8],[560,150,10,8],[590,150,10,8],[620,150,10,8],
        [500,164,10,8],[515,164,10,8],[545,164,10,8],[590,164,10,8],[635,164,10,8],
        [500,178,10,8],[530,178,10,8],[575,178,10,8],[605,178,10,8],[635,178,10,8],
        [515,192,10,8],[545,192,10,8],[560,192,10,8],[590,192,10,8],[620,192,10,8],
        [500,206,10,8],[515,206,10,8],[545,206,10,8],[575,206,10,8],[635,206,10,8],
      ].map(([x,y,w,h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={windowColor} opacity={0.5 + (i % 5) * 0.1} />
      ))}

      {/* ── TOWER CRANE (above construction building) ───────────────────────── */}
      {/* Vertical mast */}
      <rect x="564" y="28" width="10" height="90" fill={craneBg} />
      {/* Horizontal jib (right arm — longer) */}
      <rect x="574" y="32" width="130" height="6" fill={craneBg} />
      {/* Counter-jib (left arm — shorter) */}
      <rect x="440" y="32" width="124" height="6" fill={craneBg} />
      {/* Jib tip support lines (stylized) */}
      <line x1="569" y1="38" x2="700" y2="38" stroke={craneBg} strokeWidth="1.5" />
      {/* Hoist rope */}
      <line x1="680" y1="38" x2="680" y2="70" stroke={craneBg} strokeWidth="2" />
      {/* Hook block */}
      <rect x="675" y="70" width="10" height="7" fill={craneBg} />
      {/* Counterweight */}
      <rect x="440" y="36" width="28" height="14" fill={craneBg} />
      {/* Red beacon at top of mast */}
      <circle cx="569" cy="26" r="5" fill="#FF3B30" />
      <circle cx="569" cy="26" r="3" fill="#FF6B5B" />

      {/* ── Right side buildings ─────────────────────────────────────────────── */}
      {/* Slightly narrower tower */}
      <rect x="663" y="168" width="55" height="132" fill={buildingColor} />
      <rect x="672" y="178" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="686" y="178" width="8" height="6" fill={windowColor} opacity="0.6" />
      <rect x="700" y="178" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="672" y="191" width="8" height="6" fill={windowColor} opacity="0.5" />
      <rect x="686" y="191" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="700" y="191" width="8" height="6" fill={windowColor} opacity="0.4" />
      <rect x="672" y="204" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="700" y="204" width="8" height="6" fill={windowColor} opacity="0.7" />
      <rect x="686" y="217" width="8" height="6" fill={windowColor} opacity="0.9" />

      {/* Wide mid building */}
      <rect x="726" y="182" width="105" height="118" fill={buildingColor} />
      <rect x="737" y="192" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="752" y="192" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="767" y="192" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="782" y="192" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="797" y="192" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="812" y="192" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="737" y="206" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="767" y="206" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="797" y="206" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="737" y="220" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="752" y="220" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="812" y="220" width="9" height="7" fill={windowColor} opacity="0.8" />

      {/* Tall right tower */}
      <rect x="839" y="145" width="52" height="155" fill={buildingColor} />
      <rect x="848" y="155" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="862" y="155" width="8" height="6" fill={windowColor} opacity="0.7" />
      <rect x="875" y="155" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="848" y="168" width="8" height="6" fill={windowColor} opacity="0.5" />
      <rect x="862" y="168" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="875" y="168" width="8" height="6" fill={windowColor} opacity="0.4" />
      <rect x="848" y="181" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="875" y="181" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="862" y="194" width="8" height="6" fill={windowColor} opacity="0.7" />
      <rect x="848" y="207" width="8" height="6" fill={windowColor} opacity="0.6" />
      <rect x="875" y="207" width="8" height="6" fill={windowColor} opacity="0.9" />

      {/* Medium block */}
      <rect x="899" y="200" width="80" height="100" fill={buildingColor} />
      <rect x="909" y="210" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="924" y="210" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="939" y="210" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="954" y="210" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="909" y="224" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="939" y="224" width="9" height="7" fill={windowColor} opacity="0.7" />

      {/* Far right group */}
      <rect x="987" y="175" width="60" height="125" fill={buildingColor} />
      <rect x="997" y="185" width="8" height="6" fill={windowColor} opacity="0.7" />
      <rect x="1011" y="185" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="1025" y="185" width="8" height="6" fill={windowColor} opacity="0.6" />
      <rect x="997" y="198" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="1025" y="198" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="1011" y="211" width="8" height="6" fill={windowColor} opacity="0.5" />
      <rect x="997" y="224" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="1025" y="224" width="8" height="6" fill={windowColor} opacity="0.7" />

      <rect x="1055" y="210" width="75" height="90" fill={buildingColor} />
      <rect x="1065" y="220" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="1080" y="220" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="1095" y="220" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="1110" y="220" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="1065" y="234" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="1095" y="234" width="9" height="7" fill={windowColor} opacity="0.9" />

      <rect x="1138" y="192" width="50" height="108" fill={buildingColor} />
      <rect x="1147" y="202" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="1161" y="202" width="8" height="6" fill={windowColor} opacity="0.6" />
      <rect x="1173" y="202" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="1147" y="216" width="8" height="6" fill={windowColor} opacity="0.5" />
      <rect x="1173" y="216" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="1161" y="230" width="8" height="6" fill={windowColor} opacity="0.7" />

      <rect x="1196" y="215" width="85" height="85" fill={buildingColor} />
      <rect x="1206" y="225" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="1221" y="225" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="1236" y="225" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="1251" y="225" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="1266" y="225" width="9" height="7" fill={windowColor} opacity="0.5" />
      <rect x="1206" y="239" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="1236" y="239" width="9" height="7" fill={windowColor} opacity="0.7" />

      <rect x="1289" y="200" width="48" height="100" fill={buildingColor} />
      <rect x="1298" y="210" width="8" height="6" fill={windowColor} opacity="0.8" />
      <rect x="1312" y="210" width="8" height="6" fill={windowColor} opacity="0.6" />
      <rect x="1325" y="210" width="8" height="6" fill={windowColor} opacity="0.9" />
      <rect x="1298" y="224" width="8" height="6" fill={windowColor} opacity="0.5" />
      <rect x="1325" y="224" width="8" height="6" fill={windowColor} opacity="0.8" />

      <rect x="1345" y="225" width="95" height="75" fill={buildingColor} />
      <rect x="1355" y="235" width="9" height="7" fill={windowColor} opacity="0.7" />
      <rect x="1370" y="235" width="9" height="7" fill={windowColor} opacity="0.9" />
      <rect x="1385" y="235" width="9" height="7" fill={windowColor} opacity="0.6" />
      <rect x="1400" y="235" width="9" height="7" fill={windowColor} opacity="0.8" />
      <rect x="1415" y="235" width="9" height="7" fill={windowColor} opacity="0.5" />

      {/* Ground fill */}
      <rect x="0" y="298" width="1440" height="2" fill={buildingColor} opacity="0.5" />
    </svg>
  )
}

// ─── Glass floating card ───────────────────────────────────────────────────────

function HeroCard() {
  return (
    <div
      className="glass-card rounded-2xl px-5 py-4 w-[280px] shadow-glass"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-syne text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-0.5">
            Lot 02 · Gros œuvre
          </p>
          <p className="font-fraunces text-[15px] text-white leading-snug">
            Groupe scolaire Jules Verne
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 bg-menthe/20 text-menthe border border-menthe/30 rounded-pill px-2.5 py-1 font-syne text-[11px] font-bold uppercase tracking-wider">
          GO
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-syne text-[11px] text-white/40">Score d&apos;adéquation</span>
          <span className="font-syne text-[13px] font-bold text-cuivre-glow">88 / 100</span>
        </div>
        <div className="h-1.5 rounded-pill bg-white/8 overflow-hidden">
          <div className="h-full rounded-pill bg-gradient-to-r from-menthe to-cuivre" style={{ width: '88%' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/4 rounded-xl px-3 py-2">
          <p className="font-syne text-[10px] text-white/35 mb-0.5">Médiane acheteur</p>
          <p className="font-syne text-[13px] font-bold text-white">505 k€</p>
        </div>
        <div className="bg-white/4 rounded-xl px-3 py-2">
          <p className="font-syne text-[10px] text-white/35 mb-0.5">Remise le</p>
          <p className="font-syne text-[13px] font-bold text-cuivre-glow">4 déc.</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {['CCTP joint', 'Certification requise', 'Zone IDF'].map((tag) => (
          <span key={tag} className="font-syne text-[10px] text-white/40 bg-white/5 border border-white/8 rounded-lg px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Feature row ──────────────────────────────────────────────────────────────

function FeatureRow({
  tag,
  title,
  description,
  bullets,
  mockup,
  reverse = false,
}: {
  tag: string
  title: string
  description: string
  bullets: string[]
  mockup: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}>
      <div className="flex-1">
        <p className="font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-cuivre mb-3">{tag}</p>
        <h3 className="font-fraunces text-[26px] md:text-[32px] text-text tracking-tight leading-tight mb-4">{title}</h3>
        <p className="font-syne text-[15px] text-text-muted leading-relaxed mb-5">{description}</p>
        <ul className="space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 font-syne text-[14px] text-text-muted">
              <svg className="shrink-0 mt-0.5 text-menthe" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 w-full">
        {mockup}
      </div>
    </div>
  )
}

// ─── Feature mockups ──────────────────────────────────────────────────────────

function GoNoGoMockup() {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card-md overflow-hidden">
      <div className="bg-gradient-to-br from-[#0F1B4D] to-[#1E3A8A] px-5 py-4">
        <p className="font-syne text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-1">Analyse DCE</p>
        <p className="font-fraunces text-[17px] text-white">Réhabilitation réseau EP · Lot 3</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {[
          { label: 'Chiffre d\'affaires requis', status: 'go', note: '≥ 2 M€ · votre profil : 4,2 M€' },
          { label: 'Certification Qualibat', status: 'go', note: '3521 · validité OK' },
          { label: 'Zone géographique', status: 'vigilance', note: 'Déplacement > 80 km' },
          { label: 'Délai de remise', status: 'go', note: '14 jours · suffisant' },
        ].map(({ label, status, note }) => (
          <div key={label} className="flex items-center gap-3">
            <span className={`shrink-0 w-2 h-2 rounded-full ${status === 'go' ? 'bg-menthe' : 'bg-brand-amber'}`} />
            <div className="flex-1 min-w-0">
              <p className="font-syne text-[13px] font-semibold text-text truncate">{label}</p>
              <p className="font-syne text-[11px] text-text-muted truncate">{note}</p>
            </div>
            <span className={`shrink-0 font-syne text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
              status === 'go' ? 'bg-menthe/12 text-menthe-dark' : 'bg-brand-amber-subtle text-brand-amber'
            }`}>
              {status === 'go' ? 'OK' : 'Attention'}
            </span>
          </div>
        ))}
      </div>
      <div className="mx-5 mb-5 flex items-center gap-3 bg-menthe/8 border border-menthe/20 rounded-xl px-4 py-3">
        <span className="font-syne text-[13px] font-bold text-menthe-dark uppercase tracking-wide">GO</span>
        <span className="font-syne text-[13px] text-text-muted">Profil adapté · 3 points de vigilance</span>
      </div>
    </div>
  )
}

function PrixMockup() {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card-md overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <p className="font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-widest mb-1">Positionnement prix</p>
        <p className="font-fraunces text-[16px] text-text">Électricité courants forts · Mairie</p>
      </div>
      <div className="px-5 py-5">
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <span className="font-syne text-[12px] text-text-muted">Fourchette marchés similaires</span>
            <span className="font-syne text-[12px] font-bold text-text">850 marchés</span>
          </div>
          {/* Price range bar */}
          <div className="relative h-3 rounded-pill bg-background overflow-hidden">
            <div className="absolute left-[15%] right-[20%] h-full bg-gradient-to-r from-accent-light to-accent rounded-pill opacity-50" />
            <div className="absolute left-[48%] w-0.5 h-full bg-accent" />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[11px] text-text-muted">42 k€</span>
            <span className="font-mono text-[11px] font-bold text-accent">Médiane 98 k€</span>
            <span className="font-mono text-[11px] text-text-muted">185 k€</span>
          </div>
        </div>
        <div className="bg-accent-subtle border border-accent-light rounded-xl px-4 py-3">
          <p className="font-syne text-[12px] font-semibold text-accent-fg">Fourchette recommandée</p>
          <p className="font-fraunces text-[20px] text-accent-fg font-bold">85 — 112 k€</p>
          <p className="font-syne text-[11px] text-accent/75">Pour rester dans le décile gagnant</p>
        </div>
      </div>
    </div>
  )
}

function MemoireMockup() {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card-md overflow-hidden">
      <div className="bg-gradient-to-r from-background to-surface px-5 py-3 border-b border-border flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-300" />
        <span className="w-3 h-3 rounded-full bg-yellow-300" />
        <span className="w-3 h-3 rounded-full bg-green-300" />
        <span className="font-mono text-[11px] text-text-muted ml-2">mémoire_technique.docx</span>
      </div>
      <div className="px-5 py-4 space-y-3">
        {[
          { heading: '1. Présentation de l\'entreprise', lines: 3 },
          { heading: '2. Références similaires', lines: 2 },
          { heading: '3. Moyens humains et matériels', lines: 4 },
          { heading: '4. Organisation du chantier', lines: 2 },
        ].map(({ heading, lines }) => (
          <div key={heading}>
            <p className="font-syne text-[12px] font-bold text-text mb-1.5">{heading}</p>
            <div className="space-y-1.5">
              {Array.from({ length: lines }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded-pill bg-background"
                  style={{ width: `${65 + (i * 11 + 7) % 30}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 pb-4">
        <button className="w-full bg-accent text-white font-syne text-[13px] font-bold py-2.5 rounded-xl">
          Télécharger le .docx →
        </button>
      </div>
    </div>
  )
}

function ChiffrageMockup() {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card-md overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-widest">DPGF comparée</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-background">
              <th className="text-left font-syne font-semibold text-text-muted px-4 py-2">Désignation</th>
              <th className="text-right font-syne font-semibold text-text-muted px-4 py-2">Prix acheteur</th>
              <th className="text-right font-syne font-semibold text-text-muted px-4 py-2">Votre prix</th>
              <th className="text-right font-syne font-semibold text-text-muted px-4 py-2">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { label: 'Terrassement général', buyer: '18 400 €', yours: '17 200 €', delta: '-6,5 %', ok: true },
              { label: 'Gros œuvre fondations', buyer: '42 100 €', yours: '45 800 €', delta: '+8,8 %', ok: false },
              { label: 'Maçonnerie élévation', buyer: '29 300 €', yours: '28 900 €', delta: '-1,4 %', ok: true },
              { label: 'Charpente bois', buyer: '15 700 €', yours: '15 700 €', delta: '0 %', ok: true },
            ].map(({ label, buyer, yours, delta, ok }) => (
              <tr key={label} className="hover:bg-background/60 transition-colors">
                <td className="font-syne text-text px-4 py-2.5 truncate max-w-[140px]">{label}</td>
                <td className="font-mono text-text-muted text-right px-4 py-2.5">{buyer}</td>
                <td className="font-mono text-text text-right px-4 py-2.5 font-semibold">{yours}</td>
                <td className={`font-mono text-right px-4 py-2.5 font-semibold ${ok ? 'text-menthe-dark' : 'text-brand-amber'}`}>{delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  highlighted = false,
}: {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  href: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col gap-5 transition-shadow duration-200 ${
        highlighted
          ? 'bg-[#0F1B4D] border border-accent/40 shadow-[0_0_40px_rgba(37,99,235,0.15)]'
          : 'bg-surface border border-border shadow-card'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-white bg-accent px-3 py-1 rounded-pill shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
            Recommandé
          </span>
        </div>
      )}
      <div>
        <p className={`font-syne text-[12px] font-bold uppercase tracking-[0.16em] mb-2 ${highlighted ? 'text-cuivre-glow' : 'text-cuivre'}`}>
          {name}
        </p>
        <div className="flex items-end gap-1.5 mb-1">
          <span className={`font-fraunces text-[36px] font-bold leading-none ${highlighted ? 'text-white' : 'text-text'}`}>
            {price}
          </span>
          {period && (
            <span className={`font-syne text-[13px] mb-1 ${highlighted ? 'text-white/45' : 'text-text-muted'}`}>
              {period}
            </span>
          )}
        </div>
        <p className={`font-syne text-[13px] ${highlighted ? 'text-white/50' : 'text-text-muted'}`}>
          {description}
        </p>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <svg
              className={`shrink-0 mt-0.5 ${highlighted ? 'text-menthe' : 'text-menthe-dark'}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className={`font-syne text-[13px] ${highlighted ? 'text-white/75' : 'text-text-muted'}`}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block text-center font-syne text-[14px] font-bold py-3 rounded-xl transition-all duration-200 ${
          highlighted
            ? 'bg-white text-[#0F1B4D] hover:bg-white/90 shadow-[0_4px_16px_rgba(255,255,255,0.15)]'
            : 'bg-background border border-border text-text hover:border-accent/40 hover:bg-accent-subtle'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SKY_GRADIENT = 'linear-gradient(165deg, #0D1220 0%, #160D38 25%, #1B2550 52%, #0F2040 76%, #0A1628 100%)'

export default function HomePage() {
  return (
    <main>

      {/* ════ 1. HERO ════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '880px', background: SKY_GRADIENT }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 60%, rgba(37,99,235,0.08) 0%, transparent 70%)',
          }}
        />

        {/* ── Nav ── */}
        <nav className="relative z-20 max-w-7xl mx-auto px-6 pt-5 pb-2 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo variant="dark" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {['Produit', 'Méthode', 'Tarifs'].map((label) => (
              <Link
                key={label}
                href={label === 'Tarifs' ? '/pricing' : '#'}
                className="font-syne text-[14px] font-medium text-white/60 hover:text-white/90 px-4 py-2 rounded-lg transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden md:block font-syne text-[14px] font-medium text-white/55 hover:text-white/85 px-4 py-2 rounded-lg transition-colors duration-150"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="font-syne text-[14px] font-bold text-[#0F1B4D] bg-white hover:bg-white/90 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-[0_4px_16px_rgba(255,255,255,0.15)]"
            >
              Essai gratuit
            </Link>
          </div>
        </nav>

        {/* ── Hero content ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8 flex flex-col md:flex-row items-center gap-12 md:gap-8">

          {/* Left: text */}
          <div className="flex-1 text-center md:text-left">
            <p className="inline-flex items-center gap-2 font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-cuivre-glow mb-6">
              <span className="w-4 h-px bg-cuivre-glow/60" />
              Marchés publics BTP
              <span className="w-4 h-px bg-cuivre-glow/60" />
            </p>
            <h1
              className="font-fraunces text-white tracking-tight leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 3.75rem)' }}
            >
              Le chantier de demain<br />
              se gagne ce soir.
            </h1>
            <p className="font-syne text-[17px] text-white/55 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
              Stratly analyse votre DCE en quelques secondes — Go/No-Go, positionnement
              prix, mémoire technique — pour que vous répondiez mieux et plus vite.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
              <Link
                href="/signup"
                className="w-full sm:w-auto text-center font-syne text-[15px] font-bold text-[#0F1B4D] bg-white hover:bg-white/90 px-7 py-3.5 rounded-xl transition-all duration-200 shadow-[0_8px_24px_rgba(255,255,255,0.15)]"
              >
                Analyser un dossier →
              </Link>
              <Link
                href="/guide"
                className="w-full sm:w-auto text-center glass-card font-syne text-[15px] font-semibold text-white/80 hover:text-white px-7 py-3.5 rounded-xl transition-all duration-200"
              >
                Voir un exemple
              </Link>
            </div>
            <p className="font-syne text-[12px] text-white/35">
              3 analyses offertes · sans carte bancaire
            </p>
          </div>

          {/* Right: floating card */}
          <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end">
            <HeroCard />
          </div>
        </div>

        {/* ── City silhouette ── */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '300px' }}>
          <CitySilhouette />
        </div>
      </section>

      {/* ════ 2. BANDEAU DECP ════════════════════════════════════════════════ */}
      <div className="overflow-hidden bg-nuit border-y border-white/6 py-3">
        <div className="flex items-center gap-8 px-6 flex-wrap justify-center">
          {[
            { value: '850 000+', label: 'marchés DECP analysés' },
            { value: '98 %', label: 'de précision Go/No-Go' },
            { value: '< 30 s', label: 'pour analyser un DCE complet' },
            { value: '14 formats', label: 'de documents supportés' },
            { value: '3 analyses', label: 'offertes sans CB' },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-center gap-2.5 shrink-0">
              <span className="font-fraunces text-[18px] font-bold text-cuivre-glow">{value}</span>
              <span className="font-syne text-[12px] text-white/35">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════ 3. PROBLÈME ════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 bg-nuit">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-cuivre mb-3">Le problème</p>
            <h2
              className="font-fraunces text-white tracking-tight leading-tight"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}
            >
              Vous perdez des appels d&apos;offres<br />pour des raisons évitables.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                ),
                title: 'Dossiers illisibles',
                body: 'PDFs scannés, tableaux Excel complexes, zips de 40 fichiers… vous passez des heures à trouver les infos clés.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ),
                title: 'Positionnement prix aveugle',
                body: 'Sans données sur les marchés passés, vous chiffrez à l\'instinct — trop haut, vous perdez ; trop bas, vous perdez de l\'argent.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                title: 'Dossier plié en 2 jours',
                body: 'Délais courts, équipes débordées : le mémoire technique est expédié, générique, sans les arguments qui font la différence.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="glass-card rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center text-cuivre-glow mb-4">
                  {icon}
                </div>
                <h3 className="font-fraunces text-[18px] text-white mb-2">{title}</h3>
                <p className="font-syne text-[13px] text-white/45 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ 4. FONCTIONS ALTERNÉES ═════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 bg-background">
        <div className="max-w-5xl mx-auto space-y-20 md:space-y-28">
          <FeatureRow
            tag="Analyse Go / No-Go"
            title="Décidez en 30 secondes, pas en 3 heures."
            description="Stratly extrait les critères d'éligibilité de votre DCE, les compare au profil de votre entreprise et rend un verdict clair — avec les points de vigilance expliqués."
            bullets={[
              'CA requis, certifications, zone géo, références',
              'Comparaison automatique avec votre profil',
              'Verdict Go, No-Go ou Vigilance avec justifications',
            ]}
            mockup={<GoNoGoMockup />}
          />
          <FeatureRow
            tag="Positionnement prix"
            title="Chiffrez dans la fourchette gagnante."
            description="Accédez aux données DECP de 850 000 marchés passés — filtré par CPV, acheteur et zone — pour positionner votre offre dans le décile qui remporte."
            bullets={[
              'Médiane et distribution des prix par type de marché',
              'Historique des marchés de l\'acheteur spécifique',
              'Fourchette recommandée calculée automatiquement',
            ]}
            mockup={<PrixMockup />}
            reverse
          />
          <FeatureRow
            tag="Mémoire technique"
            title="Un mémoire taillé pour chaque dossier."
            description="Depuis votre analyse, générez en un clic la trame de mémoire technique adaptée aux exigences du RC et du CCTP — à compléter, pas à rédiger."
            bullets={[
              'Structure calquée sur les attentes du marché',
              'Sections pré-remplies depuis votre profil entreprise',
              'Export Word prêt à signer',
            ]}
            mockup={<MemoireMockup />}
          />
          <FeatureRow
            tag="Chiffrage comparé"
            title="Voyez où vous êtes par rapport à l'acheteur."
            description="Importez votre DPGF et notre CRM de prix : Stratly aligne poste à poste, détecte les écarts et vous signale les lignes à revoir avant de remettre."
            bullets={[
              'Matching poste à poste automatisé',
              'Détection des numéros inversés et doublons',
              'Alertes sur les écarts > 10 % par rapport à la médiane',
            ]}
            mockup={<ChiffrageMockup />}
            reverse
          />
        </div>
      </section>

      {/* ════ 5. QUATRE COUCHES ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 bg-nuit">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-cuivre mb-3">Méthodologie</p>
            <h2 className="font-fraunces text-white tracking-tight leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>
              Un dossier, quatre couches d&apos;analyse.
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Left: isometric SVG */}
            <div className="flex-shrink-0 flex justify-center">
              <IsometricLayers />
            </div>
            {/* Right: steps */}
            <div className="flex-1 space-y-7">
              {[
                { n: 1, title: 'Les exigences', body: 'Critères d\'éligibilité, chiffre d\'affaires minimum, certifications requises, zone géographique — extraits et comparés à votre profil.' },
                { n: 2, title: 'Les prix de l\'acheteur', body: 'Données DECP de 850 000 marchés passés pour positionner votre offre dans la fourchette qui remporte.' },
                { n: 3, title: 'Le mémoire technique', body: 'Trame structurée sur la grille de notation du DCE, enrichie par vos références chantiers, prête à personnaliser.' },
                { n: 4, title: 'Le verdict et l\'offre', body: 'Avis Go/No-Go chiffré, actions prioritaires classées et dossier complet prêt à remettre.' },
              ].map(({ n, title, body }) => (
                <div key={n} className="flex gap-5">
                  <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-fraunces font-bold text-[15px]"
                    style={{ background: n === 1 ? 'linear-gradient(135deg,#F2B26B,#E0875A)' : 'rgba(255,255,255,0.06)', color: n === 1 ? '#0B1020' : 'rgba(255,255,255,0.6)', border: n === 1 ? 'none' : '1px solid rgba(255,255,255,0.12)' }}>
                    {n}
                  </div>
                  <div>
                    <p className="font-fraunces text-[17px] text-white mb-1">{title}</p>
                    <p className="font-syne text-[13px] text-white/45 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════ 6. TARIFS ══════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 bg-nuit">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-cuivre mb-3">Tarifs</p>
            <h2
              className="font-fraunces text-white tracking-tight leading-tight mb-3"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}
            >
              Commencez ce soir. Gratuitement.
            </h2>
            <p className="font-syne text-[16px] text-white/45 max-w-md mx-auto">
              3 analyses complètes offertes. Aucune carte bancaire.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-start">
            <PricingCard
              name="Gratuit"
              price="0 €"
              description="Pour tester Stratly"
              features={[
                '3 analyses Go/No-Go',
                'Extraction DCE tous formats',
                'Verdict avec explications',
              ]}
              cta="Commencer gratuitement"
              href="/signup"
            />
            <PricingCard
              name="Essentiel"
              price="49 €"
              period="/ mois"
              description="Pour les PME actives"
              features={[
                'Analyses illimitées',
                'Mémoire technique généré',
                'Positionnement prix DECP',
                'Historique des analyses',
              ]}
              cta="Démarrer l'essai"
              href="/signup"
              highlighted
            />
            <PricingCard
              name="Pro"
              price="129 €"
              period="/ mois"
              description="Pour les équipes"
              features={[
                'Tout Essentiel inclus',
                'Chiffrage comparé DPGF',
                'Historique acheteur détaillé',
                'Export et API',
                'Support prioritaire',
              ]}
              cta="Contacter l'équipe"
              href="/pricing"
            />
          </div>
        </div>
      </section>

      {/* ════ 7. CTA FINAL ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 md:py-28 px-6 text-center"
        style={{ background: SKY_GRADIENT }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-cuivre-glow mb-4">
            Prêt à répondre ?
          </p>
          <h2
            className="font-fraunces text-white tracking-tight leading-tight mb-5"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
          >
            Votre prochain chantier<br />vous attend.
          </h2>
          <p className="font-syne text-[16px] text-white/50 mb-8">
            Analysez votre premier dossier en moins de 30 secondes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-syne text-[16px] font-bold text-[#0F1B4D] bg-white hover:bg-white/90 px-8 py-4 rounded-xl transition-all duration-200 shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
          >
            Commencer gratuitement
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <p className="font-syne text-[12px] text-white/28 mt-4">
            3 analyses offertes · sans carte bancaire · résiliation libre
          </p>
        </div>
        {/* Mini silhouette */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-50" style={{ height: '120px' }}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="xMidYMax meet" fill="none" className="w-full h-full" aria-hidden="true">
            <rect x="0" y="60" width="120" height="60" fill="#0A0F1A" />
            <rect x="130" y="40" width="60" height="80" fill="#0A0F1A" />
            <rect x="200" y="55" width="90" height="65" fill="#0A0F1A" />
            <rect x="300" y="30" width="50" height="90" fill="#0A0F1A" />
            <rect x="360" y="50" width="110" height="70" fill="#0A0F1A" />
            <rect x="480" y="20" width="75" height="100" fill="#0A0F1A" />
            <rect x="565" y="45" width="55" height="75" fill="#0A0F1A" />
            <rect x="630" y="35" width="80" height="85" fill="#0A0F1A" />
            <rect x="720" y="55" width="100" height="65" fill="#0A0F1A" />
            <rect x="830" y="25" width="60" height="95" fill="#0A0F1A" />
            <rect x="900" y="50" width="90" height="70" fill="#0A0F1A" />
            <rect x="1000" y="40" width="70" height="80" fill="#0A0F1A" />
            <rect x="1080" y="60" width="110" height="60" fill="#0A0F1A" />
            <rect x="1200" y="35" width="55" height="85" fill="#0A0F1A" />
            <rect x="1265" y="55" width="85" height="65" fill="#0A0F1A" />
            <rect x="1360" y="45" width="80" height="75" fill="#0A0F1A" />
          </svg>
        </div>
      </section>

    </main>
  )
}
