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
    <div className="min-h-screen relative flex items-center justify-center px-6 py-10">
      <AuthBackdrop />

      <div className="relative z-10 w-full max-w-sm bg-[#0b1024]/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_70px_-15px_rgba(30,159,224,0.35)] p-8">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="w-12 h-12 rounded-xl object-cover shadow-lg mb-5" />
        ) : (
          <div className="w-12 h-12 tab-corner bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-display font-bold text-base shadow-lg shadow-primary/30 mb-5">
            BC
          </div>
        )}
        {eyebrow && <p className="text-[#4db8f0] text-xs font-semibold tracking-wide mb-1">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-bold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-white/50 text-xs mb-6">{subtitle}</p>}
        {children}
        {footer && <div className="text-center text-white/40 text-xs mt-6">{footer}</div>}
      </div>
    </div>
  );
}