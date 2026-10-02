import { CalendarCheck, Wallet, Award, Clock } from "lucide-react";

const FEATURES = [
  { icon: CalendarCheck, label: "Attendance" },
  { icon: Wallet, label: "Fees" },
  { icon: Award, label: "Results" },
  { icon: Clock, label: "Timetable" },
];

// The left half of every auth screen on wide viewports. Leans into the
// register/ledger motif already used elsewhere in the app (tab-corner tiles,
// ruled-paper texture) instead of a generic illustration, and uses the
// product's own approved tagline rather than invented copy or stats.
export default function AuthBrandPanel() {
  return (
    <div className="relative z-10 hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between px-14 py-16 overflow-hidden">
      <div className="ledger-rule absolute inset-0 opacity-[0.07] pointer-events-none" />

      <div className="w-11 h-11 tab-corner bg-gradient-to-br from-primary to-primary-deep text-white flex items-center justify-center font-display font-bold text-sm shadow-lg shadow-primary/30">
        BC
      </div>

      <div className="max-w-sm">
        <h1 className="font-display text-[2.35rem] leading-[1.12] font-semibold text-white tracking-tight">
          Everything your school needs.
          <br />
          Everything parents need to know.
        </h1>
        <p className="text-ink-soft text-sm leading-relaxed mt-5">
          One place for admissions, attendance, fees, and results — built for schools, academies, and training centers.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-9">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="tab-corner bg-white/[0.04] border border-white/10 px-4 py-3 flex items-center gap-2.5">
              <Icon size={15} className="text-primary-light shrink-0" />
              <span className="text-ink-soft text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-white/25 text-xs">Bro&apos;s Code</p>
    </div>
  );
}
