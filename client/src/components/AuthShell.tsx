import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import api from "../services/api";
import AuthBackdrop from "./AuthBackdrop";
import AuthBrandPanel from "./AuthBrandPanel";

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
    <div className="min-h-screen relative flex">
      <AuthBackdrop />
      <AuthBrandPanel />

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10 lg:border-l lg:border-white/10">
      <div className="w-full max-w-sm">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="w-11 h-11 rounded-xl object-cover shadow-lg mb-6 lg:hidden" />
        ) : (
          <div className="w-11 h-11 tab-corner bg-gradient-to-br from-primary to-primary-deep text-white flex items-center justify-center font-display font-bold text-sm shadow-lg shadow-primary/30 mb-6 lg:hidden">
            BC
          </div>
        )}
        {eyebrow && <p className="text-primary-light text-xs font-semibold mb-1">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-semibold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-white/50 text-xs mb-6">{subtitle}</p>}
        {children}
        {footer && <div className="text-center text-white/40 text-xs mt-6">{footer}</div>}
      </div>
      </div>
    </div>
  );
}