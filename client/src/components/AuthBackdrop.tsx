// A code-drawn "campus at night" scene replacing the stock photo background
// on every auth page. Heavier and more deliberate than a generic photo:
// a layered gradient sky, a tall lit campus skyline, and a faint ledger-grid
// texture tying it back to the register/ledger motif used across the app.
export default function AuthBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05060d]">
      {/* Deep gradient mesh - two soft glows anchor the composition instead
          of a flat single color, giving the scene real depth. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 900px 700px at 78% 8%, rgba(30,159,224,0.22), transparent 60%), " +
            "radial-gradient(ellipse 700px 600px at 15% 95%, rgba(245,158,11,0.10), transparent 55%), " +
            "linear-gradient(180deg, #05060d 0%, #070a18 55%, #05060d 100%)",
        }}
      />

      {/* Faint ledger-rule lines - same texture used on register-tile cards
          elsewhere, at very low opacity so it reads as paper, not a grid. */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent, transparent 38px, #ffffff 38px, #ffffff 39px)",
        }}
      />

      <svg
        viewBox="0 0 1200 1000"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#eaf4ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#eaf4ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="towerFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101a3d" />
            <stop offset="100%" stopColor="#0a0f26" />
          </linearGradient>
          <linearGradient id="groundGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e9fe0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1e9fe0" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="960" cy="120" r="220" fill="url(#moonGlow)" />
        <circle cx="960" cy="120" r="46" fill="#ffffff" fillOpacity="0.92" />

        {/* Scattered stars */}
        {[
          [80, 60], [180, 140], [320, 50], [430, 180], [560, 90], [70, 260],
          [980, 320], [1100, 180], [720, 60], [250, 320], [640, 220], [1150, 60],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 2.2 : 1.4} fill="#ffffff" fillOpacity={i % 3 === 0 ? 0.7 : 0.4} />
        ))}

        {/* Ground glow strip behind the skyline */}
        <rect x="0" y="640" width="1200" height="140" fill="url(#groundGlow)" />

        {/* Campus skyline - a row of buildings of varying height, each with
            a grid of windows, some lit. Monumental rather than decorative:
            this fills the lower two-thirds of the frame with real weight. */}
        <g>
          {/* Far-left low block */}
          <rect x="0" y="560" width="120" height="220" fill="url(#towerFace)" stroke="#3f7fb8" strokeOpacity="0.3" />
          {Array.from({ length: 3 }).map((_, r) =>
            Array.from({ length: 2 }).map((_, c) => {
              const lit = (r + c) % 3 === 0;
              return <rect key={`a${r}${c}`} x={20 + c * 45} y={590 + r * 55} width="24" height="30" fill={lit ? "#ffd580" : "#1c2647"} fillOpacity={lit ? 0.8 : 0.5} />;
            })
          )}

          {/* Mid tower with peaked roof */}
          <rect x="120" y="430" width="180" height="350" fill="url(#towerFace)" stroke="#3f7fb8" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M120 430 L210 340 L300 430" fill="none" stroke="#3f7fb8" strokeOpacity="0.5" strokeWidth="1.5" strokeLinejoin="round" />
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 3 }).map((_, c) => {
              const lit = (r * 3 + c) % 4 === 1;
              return <rect key={`b${r}${c}`} x={145 + c * 45} y={460 + r * 55} width="26" height="32" fill={lit ? "#ffd580" : "#1c2647"} fillOpacity={lit ? 0.85 : 0.5} />;
            })
          )}

          {/* Tallest central spire - the anchor building */}
          <rect x="300" y="200" width="220" height="580" fill="url(#towerFace)" stroke="#7ccbf5" strokeOpacity="0.55" strokeWidth="1.8" />
          <path d="M300 200 L410 90 L520 200" fill="none" stroke="#7ccbf5" strokeOpacity="0.6" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="395" y="95" width="30" height="90" fill="#0a0f26" stroke="#7ccbf5" strokeOpacity="0.5" />
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 4 }).map((_, c) => {
              const lit = (r + c) % 3 === 0;
              return <rect key={`c${r}${c}`} x={320 + c * 45} y={230 + r * 55} width="27" height="34" fill={lit ? "#ffd580" : "#1c2647"} fillOpacity={lit ? 0.85 : 0.5} />;
            })
          )}
          <rect x="390" y="700" width="40" height="80" fill="#1e9fe0" fillOpacity="0.35" />

          {/* Right mid tower */}
          <rect x="520" y="380" width="170" height="400" fill="url(#towerFace)" stroke="#4db8f0" strokeOpacity="0.4" strokeWidth="1.4" />
          <path d="M520 380 L605 300 L690 380" fill="none" stroke="#4db8f0" strokeOpacity="0.5" strokeWidth="1.4" strokeLinejoin="round" />
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 3 }).map((_, c) => {
              const lit = (r + c) % 4 === 2;
              return <rect key={`d${r}${c}`} x={543 + c * 45} y={410 + r * 55} width="26" height="32" fill={lit ? "#ffd580" : "#1c2647"} fillOpacity={lit ? 0.85 : 0.5} />;
            })
          )}

          {/* Far-right low block */}
          <rect x="690" y="590" width="140" height="190" fill="url(#towerFace)" stroke="#3f7fb8" strokeOpacity="0.3" />
          {Array.from({ length: 3 }).map((_, r) =>
            Array.from({ length: 2 }).map((_, c) => {
              const lit = (r + c) % 3 === 1;
              return <rect key={`e${r}${c}`} x={710 + c * 55} y={615 + r * 50} width="28" height="30" fill={lit ? "#ffd580" : "#1c2647"} fillOpacity={lit ? 0.8 : 0.5} />;
            })
          )}
        </g>

        {/* Foreground ground line + reflection glow */}
        <ellipse cx="420" cy="800" rx="620" ry="18" fill="#1e9fe0" fillOpacity="0.14" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />
    </div>
  );
}
