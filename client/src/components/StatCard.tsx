import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "danger" | "accent" | "violet" | "teal" | "neutral";

const toneStyles: Record<Tone, { text: string; bg: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/12" },
  success: { text: "text-success", bg: "bg-success-soft" },
  danger: { text: "text-danger", bg: "bg-danger-soft" },
  accent: { text: "text-accent", bg: "bg-accent-soft" },
  violet: { text: "text-violet", bg: "bg-violet/12" },
  teal: { text: "text-teal", bg: "bg-teal/12" },
  neutral: { text: "text-ink-soft", bg: "bg-white/5" },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  trend?: { value: string; direction: "up" | "down" };
  trendGood?: "up" | "down";
}

// A "register tile": the number leads, the label reads underneath it like
// a ledger entry, and the tone lives in a small clipped tab in the corner
// instead of a colored left border - the latter is the templated pattern
// this replaces.
export default function StatCard({ label, value, icon: Icon, tone = "neutral", trend, trendGood = "up" }: StatCardProps) {
  const styles = toneStyles[tone];
  const trendIsGood = trend ? trend.direction === trendGood : true;

  return (
    <div className="relative bg-surface border border-border rounded-xl p-4 pt-5 overflow-hidden">
      <div className={`absolute top-0 right-0 w-9 h-9 tab-corner flex items-start justify-end p-1.5 ${styles.bg}`}>
        <Icon size={14} className={styles.text} />
      </div>
      <p className="font-display text-[1.75rem] leading-none font-bold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-muted mt-2">{label}</p>
      {trend && (
        <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trendIsGood ? "text-success" : "text-danger"}`}>
          <span>{trend.direction === "up" ? "\u2191" : "\u2193"}</span>
          {trend.value}
        </p>
      )}
    </div>
  );
}
