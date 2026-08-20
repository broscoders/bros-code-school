import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "danger" | "accent" | "violet" | "teal" | "neutral";

const toneStyles: Record<Tone, { border: string; icon: string; bg: string }> = {
  primary: { border: "border-l-[#1e9fe0]", icon: "text-[#1e9fe0]", bg: "bg-[#1e9fe0]/10" },
  success: { border: "border-l-success", icon: "text-success", bg: "bg-success-soft" },
  danger: { border: "border-l-danger", icon: "text-danger", bg: "bg-danger-soft" },
  accent: { border: "border-l-accent", icon: "text-accent", bg: "bg-accent-soft" },
  violet: { border: "border-l-violet", icon: "text-violet", bg: "bg-violet/10" },
  teal: { border: "border-l-teal", icon: "text-teal", bg: "bg-teal/10" },
  neutral: { border: "border-l-white/20", icon: "text-ink-soft", bg: "bg-white/5" },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  trend?: { value: string; direction: "up" | "down" };
  trendGood?: "up" | "down";
}

export default function StatCard({ label, value, icon: Icon, tone = "neutral", trend, trendGood = "up" }: StatCardProps) {
  const styles = toneStyles[tone];
  const trendIsGood = trend ? trend.direction === trendGood : true;

  return (
    <div className={`bg-surface border border-border border-l-4 ${styles.border} rounded-xl p-4 flex items-start justify-between`}>
      <div>
        <p className="text-xs text-muted mb-1.5">{label}</p>
        <p className="font-display text-2xl font-bold text-ink">{value}</p>
        {trend && (
          <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${trendIsGood ? "text-success" : "text-danger"}`}>
            <span>{trend.direction === "up" ? "\u2191" : "\u2193"}</span>
            {trend.value}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.bg}`}>
        <Icon size={18} className={styles.icon} />
      </div>
    </div>
  );
}