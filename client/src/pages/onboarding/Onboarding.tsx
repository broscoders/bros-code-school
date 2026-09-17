import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { CheckCircle2, Building2, GraduationCap, UserPlus, Upload, PartyPopper, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  { key: "organization", label: "Organization", icon: Building2 },
  { key: "academics", label: "Academic Setup", icon: GraduationCap },
  { key: "users", label: "Invite Your Team", icon: UserPlus },
  { key: "import", label: "Import Data", icon: Upload },
  { key: "review", label: "Review & Activate", icon: PartyPopper },
];

// Blueprint 3 (Onboarding): guided setup with visible progress, and every
// step past the first is skippable - nothing here blocks reaching Activate.
export default function Onboarding() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [orgForm, setOrgForm] = useState({ name: "", address: "", logoUrl: "" });
  const [academicForm, setAcademicForm] = useState({ sessionName: "", startDate: "", endDate: "", className: "", sectionName: "" });
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "TEACHER" });
  const [invitesSent, setInvitesSent] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/onboarding/status").then((res) => {
      if (res.data.onboardingCompleted) {
        navigate("/dashboard");
        return;
      }
      setOrgForm((f) => ({ ...f, name: res.data.school?.name || "", address: res.data.school?.address || "" }));
      setChecking(false);
    }).catch(() => setChecking(false));
  }, [navigate]);

  const next = () => {
    setCompletedSteps((s) => new Set([...s, step]));
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const skip = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const saveOrganization = async () => {
    setError("");
    setSaving(true);
    try {
      await api.put("/onboarding/branch", { name: orgForm.name, address: orgForm.address });
      if (orgForm.logoUrl) await api.put("/onboarding/organization", { logoUrl: orgForm.logoUrl });
      next();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const saveAcademics = async () => {
    if (!academicForm.sessionName || !academicForm.startDate || !academicForm.endDate) {
      setError("Session name and dates are required, or use Skip.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const sessionRes = await api.post("/academics/sessions", {
        name: academicForm.sessionName,
        startDate: academicForm.startDate,
        endDate: academicForm.endDate,
      });
      if (academicForm.className) {
        const classRes = await api.post("/academics/classes", {
          name: academicForm.className,
          sessionId: sessionRes.data._id,
          academicSystem: "General",
        });
        if (academicForm.sectionName) {
          await api.post("/academics/sections", { name: academicForm.sectionName, classId: classRes.data._id });
        }
      }
      next();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save academic setup");
    } finally {
      setSaving(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteForm.name || !inviteForm.email) return;
    setError("");
    setSaving(true);
    try {
      await api.post("/invitations", inviteForm);
      setInvitesSent([...invitesSent, inviteForm.email]);
      setInviteForm({ name: "", email: "", role: "TEACHER" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not send invitation");
    } finally {
      setSaving(false);
    }
  };

  const activate = async () => {
    setError("");
    setSaving(true);
    try {
      await api.post("/onboarding/complete");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not activate");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-ink">Let's set up your organization</h1>
          <p className="text-muted text-sm mt-1">A few quick steps. You can skip anything and finish it later from the dashboard.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                  i === step ? "border-primary bg-primary text-white" : completedSteps.has(i) ? "border-success bg-success text-white" : "border-border bg-surface text-muted"
                }`}>
                  {completedSteps.has(i) ? <CheckCircle2 size={18} /> : <s.icon size={16} />}
                </div>
                <span className={`text-[10px] ${i === step ? "text-ink font-medium" : "text-muted"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${completedSteps.has(i) ? "bg-success" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-sm">{error}</div>}

          {step === 0 && (
            <div>
              <h2 className="font-semibold text-ink mb-1">Organization details</h2>
              <p className="text-muted text-sm mb-4">Confirm your school's name and address. You can add a logo now or later.</p>
              <div className="space-y-3">
                <input placeholder="Organization / school name" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Address" value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Logo URL (optional)" value={orgForm.logoUrl} onChange={(e) => setOrgForm({ ...orgForm, logoUrl: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-semibold text-ink mb-1">Academic setup</h2>
              <p className="text-muted text-sm mb-4">Create your first academic session and, optionally, your first class and section. You can add the rest later from Academics.</p>
              <div className="space-y-3">
                <input placeholder="Session name (e.g. 2025-2026)" value={academicForm.sessionName} onChange={(e) => setAcademicForm({ ...academicForm, sessionName: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={academicForm.startDate} onChange={(e) => setAcademicForm({ ...academicForm, startDate: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" />
                  <input type="date" value={academicForm.endDate} onChange={(e) => setAcademicForm({ ...academicForm, endDate: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <input placeholder="First class name (optional, e.g. Grade 1)" value={academicForm.className} onChange={(e) => setAcademicForm({ ...academicForm, className: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                {academicForm.className && (
                  <input placeholder="First section name (optional, e.g. A)" value={academicForm.sectionName} onChange={(e) => setAcademicForm({ ...academicForm, sectionName: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-semibold text-ink mb-1">Invite your team</h2>
              <p className="text-muted text-sm mb-4">Send a few invitations to get your staff and teachers set up. You can invite more anytime from Invitations.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <input placeholder="Name" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} className="flex-1 min-w-[140px] border border-border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="flex-1 min-w-[180px] border border-border rounded-lg px-3 py-2 text-sm" />
                <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="TEACHER">Teacher</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="HEAD">Head / Vice Principal</option>
                </select>
                <button onClick={sendInvite} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
                  Send Invite
                </button>
              </div>
              {invitesSent.length > 0 && (
                <div className="text-xs text-success">Invited: {invitesSent.join(", ")}</div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-semibold text-ink mb-1">Import existing data</h2>
              <p className="text-muted text-sm mb-4">
                If you're moving from another system, you can bulk-import students and teachers from a CSV file once your
                dashboard is ready — from Students or Teachers, use "Bulk Import CSV". No need to do this now.
              </p>
              <div className="bg-canvas rounded-lg border border-border p-4 text-sm text-muted">
                You can safely skip this step and come back to it anytime.
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-semibold text-ink mb-1">Review & activate</h2>
              <p className="text-muted text-sm mb-4">
                That's it! Click below to activate your organization and go to your dashboard. You can revisit any
                setup step (Academics, Invitations, Settings) anytime.
              </p>
              <div className="bg-canvas rounded-lg border border-border p-4 text-sm space-y-1 mb-4">
                <p><span className="text-muted">Organization:</span> {orgForm.name || "—"}</p>
                <p><span className="text-muted">Academic session:</span> {academicForm.sessionName || "Not set up yet"}</p>
                <p><span className="text-muted">Invitations sent:</span> {invitesSent.length}</p>
              </div>
              <button onClick={activate} disabled={saving} className="w-full bg-success text-white py-3 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                <PartyPopper size={16} />
                {saving ? "Activating..." : "Activate My Organization"}
              </button>
            </div>
          )}

          {step < 4 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <button onClick={back} disabled={step === 0} className="text-sm text-muted hover:text-ink disabled:opacity-30 flex items-center gap-1">
                <ArrowLeft size={14} />Back
              </button>
              <div className="flex items-center gap-3">
                <button onClick={skip} className="text-sm text-muted hover:text-ink">Skip for now</button>
                <button
                  onClick={step === 0 ? saveOrganization : step === 1 ? saveAcademics : next}
                  disabled={saving}
                  className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 flex items-center gap-1.5"
                >
                  {saving ? "Saving..." : "Continue"}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
