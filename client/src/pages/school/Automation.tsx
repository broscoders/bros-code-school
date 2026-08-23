import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Zap } from "lucide-react";

const labels: Record<string, string> = {
  STUDENT_ABSENT: "Student marked absent",
  FEE_DUE_SOON: "Fee due soon (within 3 days)",
  FEE_OVERDUE: "Fee overdue",
  EXAM_APPROACHING: "Exam approaching (within 3 days)",
  ASSIGNMENT_DEADLINE_APPROACHING: "Assignment deadline approaching",
  RESULT_PUBLISHED: "Result published",
  ADMISSION_APPROVED: "Admission approved",
};

export default function Automation() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [rules, setRules] = useState<any[]>([]);
  const [editingId, setEditingId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [runResult, setRunResult] = useState("");
  const [running, setRunning] = useState(false);

  const load = async () => {
    const res = await api.get(`/automation/rules?schoolId=${schoolId}`);
    setRules(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const toggleRule = async (rule: any) => {
    await api.put(`/automation/rules/${rule._id}`, { isActive: !rule.isActive });
    load();
  };

  const startEdit = (rule: any) => {
    setEditingId(rule._id);
    setDraftMessage(rule.messageTemplate);
  };

  const saveTemplate = async (id: string) => {
    await api.put(`/automation/rules/${id}`, { messageTemplate: draftMessage });
    setEditingId("");
    load();
  };

  const runNow = async () => {
    setRunning(true);
    setRunResult("");
    try {
      const res = await api.post("/automation/run-reminders", {});
      setRunResult(`Sent ${res.data.notificationsSent} notification(s).`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">System</p>
          <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Zap size={22} className="text-primary" />Automation Rules</h1>
          <p className="text-muted mt-1 text-sm">Turn automatic notifications on or off, and customize their wording.</p>
        </div>
        <button onClick={runNow} disabled={running} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
          {running ? "Running..." : "Run Due-Date Reminders Now"}
        </button>
      </div>

      {runResult && <p className="text-success text-sm mt-3">{runResult}</p>}
      <p className="text-xs text-muted mt-2">"Run Now" checks fee due dates, upcoming exams, and assignment deadlines and sends any reminders that are due. In production this should be scheduled to run automatically once a day (e.g. via a daily cron job hitting this same endpoint).</p>

      <div className="bg-surface rounded-2xl border border-border shadow-sm mt-6 divide-y divide-black/5">
        {rules.map((rule) => (
          <div key={rule._id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-ink">{labels[rule.triggerEvent] || rule.triggerEvent}</p>
                {rule.lastRunAt && <p className="text-muted text-xs mt-0.5">Last run: {new Date(rule.lastRunAt).toLocaleString()}</p>}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={rule.isActive} onChange={() => toggleRule(rule)} className="sr-only peer" />
                <div className="w-9 h-5 bg-canvas peer-checked:bg-primary rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
              </label>
            </div>

            {editingId === rule._id ? (
              <div className="mt-2 flex gap-2">
                <input value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm" />
                <button onClick={() => saveTemplate(rule._id)} className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-medium">Save</button>
                <button onClick={() => setEditingId("")} className="border border-border px-3 py-2 rounded-lg text-xs">Cancel</button>
              </div>
            ) : (
              <div className="mt-2 flex justify-between items-center">
                <p className="text-muted text-xs">{rule.messageTemplate}</p>
                <button onClick={() => startEdit(rule)} className="text-primary text-xs underline whitespace-nowrap ml-3">Edit message</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
