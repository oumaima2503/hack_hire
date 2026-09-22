/** Rugy, the expedition guide: a small woven rug with a face. */
export function Rugy({ size = 120, say }: { size?: number; say?: string }) {
  return (
    <div className="rugy">
      <svg className="rugy-svg" width={size} height={size * 1.1} viewBox="0 0 100 110" aria-hidden="true">
        {/* fringes */}
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} stroke="#e8c79a" strokeWidth="2.2" strokeLinecap="round">
            <line x1={22 + i * 9.3} y1="10" x2={22 + i * 9.3} y2="2" />
            <line x1={22 + i * 9.3} y1="100" x2={22 + i * 9.3} y2="108" />
          </g>
        ))}
        <rect x="14" y="10" width="72" height="90" rx="12" fill="#c4501f" />
        <rect x="20" y="16" width="60" height="78" rx="8" fill="none" stroke="#f3b04a" strokeWidth="2.5" strokeDasharray="5 3" />
        {/* diamond motifs */}
        <path d="M50 22 L58 30 L50 38 L42 30 Z" fill="#2f3a6b" />
        <path d="M50 74 L58 82 L50 90 L42 82 Z" fill="#2f3a6b" />
        <path d="M28 64 L34 70 L28 76 L22 70 Z M72 64 L78 70 L72 76 L66 70 Z" fill="#f3b04a" />
        {/* face */}
        <ellipse cx="38" cy="52" rx="7" ry="8" fill="#fff" />
        <ellipse cx="62" cy="52" rx="7" ry="8" fill="#fff" />
        <circle className="rugy-pupil" cx="39" cy="53" r="3.6" fill="#2a1a10" />
        <circle className="rugy-pupil" cx="63" cy="53" r="3.6" fill="#2a1a10" />
        <circle cx="40.2" cy="51.6" r="1.2" fill="#fff" />
        <circle cx="64.2" cy="51.6" r="1.2" fill="#fff" />
        <ellipse cx="30" cy="61" rx="4" ry="2.4" fill="#f08a6a" opacity=".8" />
        <ellipse cx="70" cy="61" rx="4" ry="2.4" fill="#f08a6a" opacity=".8" />
        <path d="M43 62 Q50 69 57 62" stroke="#2a1a10" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </svg>
      {say && <p className="bubble">{say}</p>}
    </div>
  )
}
