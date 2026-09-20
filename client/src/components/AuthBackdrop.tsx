// Clean atmospheric background for auth pages - no literal building/skyline
// illustration, just a layered gradient mesh plus a faint ledger-rule
// texture tying back to the register/ledger motif used across the app.
// The login form is the whole point of this screen, so the backdrop stays
// quiet and out of the way rather than competing for attention.
export default function AuthBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05060d]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 1000px 800px at 50% -10%, rgba(30,159,224,0.20), transparent 60%), " +
            "radial-gradient(ellipse 800px 700px at 85% 100%, rgba(245,158,11,0.10), transparent 55%), " +
            "radial-gradient(ellipse 800px 700px at 5% 100%, rgba(30,159,224,0.12), transparent 55%), " +
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

      {/* A few scattered stars for depth, nothing figurative. */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {[
          [8, 6], [18, 14], [32, 5], [43, 18], [56, 9], [7, 26],
          [98, 32], [90, 18], [72, 6], [25, 32], [64, 22], [95, 5],
          [48, 28], [82, 24], [15, 20],
        ].map(([x, y], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i % 2 === 0 ? 1.6 : 1.1} fill="#ffffff" fillOpacity={i % 3 === 0 ? 0.5 : 0.28} />
        ))}
      </svg>
    </div>
  );
}
