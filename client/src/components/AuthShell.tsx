import type { ReactNode } from "react";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05060d] flex items-center justify-center px-5 py-10">
      {/* Decorative blurred blobs — pure CSS, no image asset needed */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-[#1e9fe0] opacity-40 blur-[90px] animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[22rem] h-[22rem] rounded-full bg-[#5b2a86] opacity-50 blur-[100px] animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 w-[30rem] h-[30rem] rounded-full bg-[#3a1660] opacity-60 blur-[110px]" />
      {/* Faint grid texture for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />

      <div className="relative z-10 w-full max-w-sm lg:max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/15 backdrop-blur flex items-center justify-center mb-4 shadow-[0_0_40px_-10px_rgba(30,159,224,0.6)]">
            <span className="font-display font-bold text-xl text-white">BC</span>
          </div>
          {eyebrow && <p className="text-white/50 text-xs tracking-wide">{eyebrow}</p>}
          <h1 className="font-display text-xl font-bold text-white">Bros Code School Portal</h1>
        </div>

        <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl px-6 py-8 sm:px-8 sm:py-9 shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-white mb-1">{title}</h2>
          {subtitle && <p className="text-white/40 text-xs mb-6">{subtitle}</p>}
          {children}
        </div>

        {footer && <div className="text-center text-white/30 text-xs mt-6">{footer}</div>}
      </div>
    </div>
  );
}
