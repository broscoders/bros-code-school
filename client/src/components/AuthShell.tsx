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
    <div className="min-h-screen relative flex items-center justify-end px-6 lg:px-20 py-10">
      <AuthBackdrop />

      {brandLogo && (
        <img
          src={brandLogo}
          alt=""
          className="pointer-events-none absolute top-0 left-0 w-full sm:w-2/3 lg:w-1/2 opacity-[0.14] mix-blend-screen select-none"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 75%)",
          }}
        />
      )}

      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
        ) : (
          <div className="w-11 h-11 tab-corner bg-primary text-white flex items-center justify-center font-display font-bold text-sm shadow-lg">
            BC
          </div>
        )}
        <div>
          <p className="font-display font-semibold text-white text-base leading-tight drop-shadow">Bros Code School</p>
          <p className="text-xs text-white/70 drop-shadow">Smart Education Ecosystem</p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-[#0b1024]/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
        {eyebrow && <p className="text-[#4db8f0] text-xs font-semibold tracking-wide mb-1">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-bold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-white/50 text-xs mb-6">{subtitle}</p>}
        {children}
        {footer && <div className="text-center text-white/40 text-xs mt-6">{footer}</div>}
      </div>
    </div>
  );
}