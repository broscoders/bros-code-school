export default function LoginIllustration() {
  return (
    <svg width="360" height="280" viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#eaf4ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#eaf4ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lightCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf4ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#eaf4ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="290" cy="40" r="70" fill="url(#moonGlow)" />
      <path d="M290 60 L120 230 L460 230 Z" fill="url(#lightCone)" />
      <circle cx="290" cy="40" r="15" fill="#ffffff" fillOpacity="0.9" />

      {[
        [20, 20], [60, 55], [130, 15], [180, 70], [40, 100], [330, 100], [345, 55],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? "1.5" : "1"} fill="#ffffff" fillOpacity="0.55" />
      ))}

      <g transform="translate(20, 130)">
        <rect x="0" y="55" width="42" height="65" rx="2" fill="#0a0f26" stroke="#3f7fb8" strokeOpacity="0.35" strokeWidth="1" />
        <rect x="10" y="65" width="14" height="16" rx="1" fill="#ffd580" fillOpacity="0.75" />

        <rect x="42" y="35" width="110" height="85" rx="2" fill="#0d1330" stroke="#3f7fb8" strokeOpacity="0.5" strokeWidth="1.3" />
        {[0, 1, 2].map((c) => (
          <rect key={"m" + c} x={58 + c * 28} y="55" width="15" height="19" rx="1" fill={c === 1 ? "#ffd580" : "#1c2647"} fillOpacity={c === 1 ? 0.8 : 0.5} />
        ))}

        <rect x="82" y="-30" width="80" height="150" rx="2" fill="#0f1738" stroke="#7ccbf5" strokeOpacity="0.6" strokeWidth="1.4" />
        <path d="M82 -30 L122 -62 L162 -30" stroke="#7ccbf5" strokeOpacity="0.65" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => {
            const lit = (row + col) % 2 === 0;
            return (
              <rect
                key={"t" + row + col}
                x={96 + col * 33}
                y={-8 + row * 30}
                width="15"
                height="18"
                rx="1"
                fill={lit ? "#ffd580" : "#1c2647"}
                fillOpacity={lit ? 0.8 : 0.5}
              />
            );
          })
        )}

        <rect x="185" y="10" width="34" height="110" rx="2" fill="#101a3d" stroke="#4db8f0" strokeOpacity="0.5" strokeWidth="1.3" />
        <path d="M185 10 L202 -14 L219 10" stroke="#4db8f0" strokeOpacity="0.55" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
        {[0, 1, 2].map((row) => (
          <rect key={"s" + row} x="193" y={22 + row * 30} width="17" height="17" rx="1" fill={row === 1 ? "#ffd580" : "#1c2647"} fillOpacity={row === 1 ? 0.8 : 0.5} />
        ))}

        <rect x="88" y="90" width="22" height="30" fill="#1e9fe0" fillOpacity="0.4" />
      </g>

      <ellipse cx="180" cy="255" rx="180" ry="9" fill="#1e9fe0" fillOpacity="0.12" />
    </svg>
  );
}