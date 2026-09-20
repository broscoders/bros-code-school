import { useEffect, useState } from "react";
import api from "../../services/api";
import { MessageSquareWarning } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-warning/10 text-warning",
  IN_REVIEW: "bg-accent-soft text-accent",
  RESOLVED: "bg-success/10 text-success",
};

export default function ParentComplaints() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ category: "GENERAL", subject: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get("/complaints/mine").then((res) => setTickets(res.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/complaints", form);
      setForm({ category: "GENERAL", subject: "", description: "" });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Support</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <MessageSquareWarning size={22} className="text-primary" />Report an Issue
        </h1>
        <p className="text-muted mt-1 text-sm">Raise a ticket for the school office and track its status here.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mb-6 space-y-3">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm w-full">
          <option value="GENERAL">General</option>
          <option value="ACADEMIC">Academic</option>
          <option value="TECHNICAL">Technical / Facilities</option>
          <option value="TRANSPORT">Transport</option>
          <option value="FEE">Fee</option>
        </select>
        <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm w-full" required />
        <textarea placeholder="Describe the issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm w-full" rows={3} required />
        <button disabled={submitting} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60">
          {submitting ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted">You haven't raised any tickets yet.</p>
        ) : (
          tickets.map((t) => (
            <div key={t._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-[11px] text-muted font-mono">{t.ticketNumber}</p>
                  <h3 className="font-semibold text-ink text-sm">{t.subject}</h3>
                </div>
                <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[t.status]}`}>{t.status.replace("_", " ")}</span>
              </div>
              <p className="text-sm text-muted mt-1">{t.description}</p>
              <p className="text-[11px] text-muted mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
