'use client'

/** Illustrated hero panels for Tools Center — no external image assets. */

export function CalculatorsArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 360"
      className={className}
      role="img"
      aria-label="Engineering calculator illustration"
    >
      <defs>
        <linearGradient id="calc-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1f33" />
          <stop offset="55%" stopColor="#123a5c" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="calc-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="calc-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#022c22" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <filter id="calc-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#020617" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect width="640" height="360" fill="url(#calc-bg)" />

      {/* Schematic grid */}
      <g opacity="0.18" stroke="#94a3b8" strokeWidth="1">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={40 + i * 50} y1="20" x2={40 + i * 50} y2="340" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="20" y1={30 + i * 50} x2="620" y2={30 + i * 50} />
        ))}
      </g>

      {/* Floating formula chips */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="14" fill="#e2e8f0">
        <rect x="36" y="42" width="118" height="34" rx="8" fill="#0f172a" opacity="0.55" />
        <text x="52" y="64">V = I × R</text>
        <rect x="470" y="58" width="130" height="34" rx="8" fill="#0f172a" opacity="0.55" />
        <text x="486" y="80">P = √3·V·I</text>
        <rect x="48" y="290" width="132" height="34" rx="8" fill="#0f172a" opacity="0.55" />
        <text x="62" y="312">VD% · mm²</text>
      </g>

      {/* Calculator body */}
      <g filter="url(#calc-soft)">
        <rect x="190" y="48" width="260" height="268" rx="28" fill="url(#calc-body)" />
        <rect x="214" y="72" width="212" height="64" rx="12" fill="url(#calc-screen)" />
        <text
          x="228"
          y="100"
          fill="#6ee7b7"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="13"
        >
          WIRE SIZE
        </text>
        <text
          x="228"
          y="124"
          fill="#ecfdf5"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="22"
          fontWeight="700"
        >
          2.5 mm²
        </text>

        {/* Keypad */}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => {
            const labels = [
              ['7', '8', '9', '÷'],
              ['4', '5', '6', '×'],
              ['1', '2', '3', '−'],
              ['0', '.', '=', '+'],
            ]
            const isOp = col === 3 || (row === 3 && col === 2)
            return (
              <g key={`${row}-${col}`}>
                <rect
                  x={220 + col * 52}
                  y={156 + row * 36}
                  width="44"
                  height="28"
                  rx="7"
                  fill={isOp ? '#0f2744' : '#ffffff'}
                  stroke={isOp ? '#0f2744' : '#cbd5e1'}
                />
                <text
                  x={242 + col * 52}
                  y={175 + row * 36}
                  textAnchor="middle"
                  fill={isOp ? '#f8fafc' : '#0f172a'}
                  fontFamily="system-ui, sans-serif"
                  fontSize="13"
                  fontWeight="700"
                >
                  {labels[row]![col]}
                </text>
              </g>
            )
          })
        )}
      </g>

      {/* Cable / resistor accent */}
      <g transform="translate(520 220)" stroke="#5eead4" strokeWidth="3" fill="none">
        <path d="M0 20 H18 L26 8 L34 32 L42 8 L50 32 L58 20 H78" />
        <circle cx="0" cy="20" r="4" fill="#5eead4" />
        <circle cx="78" cy="20" r="4" fill="#5eead4" />
      </g>
    </svg>
  )
}

export function BrainGamesArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 360"
      className={className}
      role="img"
      aria-label="Brain Training games illustration"
    >
      <defs>
        <linearGradient id="game-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="45%" stopColor="#0f2744" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="game-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <filter id="game-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#020617" floodOpacity="0.4" />
        </filter>
      </defs>

      <rect width="640" height="360" fill="url(#game-bg)" />

      {/* Soft orbs */}
      <circle cx="90" cy="70" r="60" fill="#38bdf8" opacity="0.16" />
      <circle cx="560" cy="280" r="80" fill="#f59e0b" opacity="0.14" />
      <circle cx="520" cy="70" r="40" fill="#a78bfa" opacity="0.18" />

      {/* Color-word tile */}
      <g filter="url(#game-soft)">
        <rect x="70" y="70" width="200" height="220" rx="24" fill="url(#game-card)" />
        <text
          x="170"
          y="110"
          textAnchor="middle"
          fill="#64748b"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight="700"
          letterSpacing="2"
        >
          COLOR-WORD
        </text>
        <text
          x="170"
          y="175"
          textAnchor="middle"
          fill="#e11d48"
          fontFamily="system-ui, sans-serif"
          fontSize="42"
          fontWeight="900"
          letterSpacing="4"
        >
          BLUE
        </text>
        <circle cx="150" cy="220" r="10" fill="#e11d48" />
        <text x="168" y="225" fill="#475569" fontSize="12" fontFamily="system-ui, sans-serif">
          ink color
        </text>
        <rect x="96" y="248" width="64" height="26" rx="8" fill="#047857" />
        <rect x="180" y="248" width="64" height="26" rx="8" fill="#0f172a" />
        <text x="128" y="266" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
          YES
        </text>
        <text x="212" y="266" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
          NO
        </text>
      </g>

      {/* Sequence tile */}
      <g filter="url(#game-soft)">
        <rect x="310" y="54" width="250" height="120" rx="20" fill="url(#game-card)" />
        <text
          x="435"
          y="84"
          textAnchor="middle"
          fill="#64748b"
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.5"
          fontFamily="system-ui, sans-serif"
        >
          SEQUENCE SPOTTER
        </text>
        <text
          x="435"
          y="120"
          textAnchor="middle"
          fill="#0f172a"
          fontFamily="ui-monospace, Menlo, monospace"
          fontSize="22"
          fontWeight="800"
          letterSpacing="3"
        >
          7 3 9 1 5
        </text>
        <text
          x="435"
          y="152"
          textAnchor="middle"
          fill="#1d4ed8"
          fontFamily="ui-monospace, Menlo, monospace"
          fontSize="22"
          fontWeight="800"
          letterSpacing="3"
        >
          7 3 8 1 5
        </text>
      </g>

      {/* Logic / quiz tile */}
      <g filter="url(#game-soft)">
        <rect x="310" y="196" width="250" height="110" rx="20" fill="#0b1220" />
        <text
          x="435"
          y="228"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.5"
          fontFamily="system-ui, sans-serif"
        >
          LOGIC GATES
        </text>
        {/* Mini AND-like shape */}
        <path
          d="M360 250 H400 Q440 250 440 270 Q440 290 400 290 H360 Z"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
        />
        <line x1="340" y1="258" x2="360" y2="258" stroke="#38bdf8" strokeWidth="3" />
        <line x1="340" y1="282" x2="360" y2="282" stroke="#38bdf8" strokeWidth="3" />
        <line x1="440" y1="270" x2="470" y2="270" stroke="#38bdf8" strokeWidth="3" />
        <text x="500" y="275" fill="#e2e8f0" fontSize="16" fontWeight="800" fontFamily="system-ui">
          YES?
        </text>
      </g>
    </svg>
  )
}
