import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import api from "../services/api";
import AuthBackdrop from "./AuthBackdrop";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/schools/public/branding")
      .then((res) => setBrandLogo(res.data?.logoUrl || null))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12">
      <AuthBackdrop />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="flex flex-col items-center gap-3 mb-7">
          {brandLogo ? (
            <img src={brandLogo} alt="" className="w-12 h-12 rounded-xl object-cover shadow-lg" />
          ) : (
            <div className="w-12 h-12 tab-corner bg-gradient-to-br from-primary to-primary-deep text-white flex items-center justify-center font-display font-bold text-base shadow-lg shadow-primary/30">
              BC
            </div>
          )}
          <span className="font-display text-white/90 font-semibold text-sm">Bro&apos;s Code School</span>
        </div>

        <div className="relative tab-corner bg-surface/80 backdrop-blur-xl border border-white/10 shadow-[0_30px_90px_-25px_rgba(79,140,255,0.45)] px-8 py-9 overflow-hidden">
          <div className="ledger-rule absolute inset-0 opacity-[0.045] pointer-events-none" />
          <div className="relative">
            {eyebrow && <p className="text-primary-light text-xs font-semibold mb-1">{eyebrow}</p>}
            <h2 className="font-display text-2xl font-semibold text-white mb-1">{title}</h2>
            {subtitle && <p className="text-white/50 text-xs mb-6">{subtitle}</p>}
            {children}
            {footer && <div className="text-center text-white/40 text-xs mt-6">{footer}</div>}
          </div>
        </div>

        <p className="text-center text-white/25 text-[11px] mt-6">Bro&apos;s Code</p>
      </div>
    </div>
  );
}