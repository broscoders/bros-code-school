import { useState } from "react";
import { KeyRound, X, Copy, Check } from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

// Blueprint 73 (Security): lets any user turn on TOTP-based two-factor
// auth for their own account. Self-contained trigger+modal (same pattern
// as ActiveSessionsButton) so every layout only needs one extra line.
export default function TwoFactorButton() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<"status" | "qr" | "confirm" | "backup-codes" | "disable">("status");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const openModal = () => {
    setOpen(true);
    setStep("status");
    setError("");
    // The login/user object doesn't carry this flag today, so the modal
    // just offers "Enable" - if it's already on, setup will say so.
    setEnabled(null);
  };

  const startSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/2fa/setup");
      setQrCodeDataUrl(res.data.qrCodeDataUrl);
      setStep("qr");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not start setup");
      if (err.response?.data?.message?.includes("already enabled")) setEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/2fa/verify-setup", { code });
      setBackupCodes(res.data.backupCodes);
      setEnabled(true);
      setStep("backup-codes");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/2fa/disable", { password });
      setEnabled(false);
      setStep("status");
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not disable");
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-soft hover:bg-white/5 hover:text-ink w-full"
      >
        <KeyRound size={17} />
        Two-Factor Auth
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-surface rounded-xl border border-border shadow-lg max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <KeyRound size={18} className="text-primary" />Two-Factor Authentication
              </h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-ink"><X size={18} /></button>
            </div>

            <div className="p-4">
              {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-xs">{error}</div>}

              {step === "status" && (
                <div>
                  <p className="text-sm text-muted mb-4">
                    Add an extra layer of security to {user?.email}'s account using an authenticator app like Google Authenticator or Authy.
                  </p>
                  {enabled === true ? (
                    <button onClick={() => setStep("disable")} className="w-full text-sm font-medium text-danger border border-danger/30 rounded-lg py-2 hover:bg-danger/10">
                      Disable Two-Factor Authentication
                    </button>
                  ) : (
                    <button onClick={startSetup} disabled={loading} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
                      {loading ? "Starting..." : "Enable Two-Factor Authentication"}
                    </button>
                  )}
                </div>
              )}

              {step === "qr" && (
                <div>
                  <p className="text-sm text-muted mb-3">Scan this QR code with your authenticator app, then enter the 6-digit code it shows.</p>
                  {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="2FA QR code" className="mx-auto mb-4 rounded-lg border border-border" />}
                  <form onSubmit={confirmSetup}>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      autoFocus
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-center tracking-widest mb-3"
                      required
                    />
                    <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
                      {loading ? "Verifying..." : "Verify & Enable"}
                    </button>
                  </form>
                </div>
              )}

              {step === "backup-codes" && (
                <div>
                  <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 mb-4 text-success text-sm font-medium">
                    Two-factor authentication is now enabled!
                  </div>
                  <p className="text-sm text-muted mb-3">
                    Save these one-time backup codes somewhere safe. Each one can be used once if you lose access to your authenticator app.
                  </p>
                  <div className="bg-canvas rounded-lg border border-border p-3 font-mono text-xs grid grid-cols-2 gap-2 mb-3">
                    {backupCodes.map((c) => <span key={c}>{c}</span>)}
                  </div>
                  <button onClick={copyBackupCodes} className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2 text-sm text-ink hover:bg-canvas mb-3">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy codes"}
                  </button>
                  <button onClick={() => { setOpen(false); }} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
                    Done
                  </button>
                </div>
              )}

              {step === "disable" && (
                <form onSubmit={disable}>
                  <p className="text-sm text-muted mb-3">Enter your password to disable two-factor authentication.</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Current password"
                    autoFocus
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3"
                    required
                  />
                  <button type="submit" disabled={loading} className="w-full bg-danger text-white py-2 rounded-lg text-sm font-medium hover:bg-danger/90 disabled:opacity-60">
                    {loading ? "Disabling..." : "Disable Two-Factor Authentication"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
