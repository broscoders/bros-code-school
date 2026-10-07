import { useState } from "react";
import api from "../services/api";

type Props = { kind: "homework" | "assignment"; itemId: string; totalMarks?: number };

// Teacher view of what students handed in for one homework / assignment, with
// marks (assignments) or a "checked" tick (homework) and optional feedback.
export default function SubmissionsPanel({ kind, itemId, totalMarks }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [draft, setDraft] = useState<Record<string, { marks: string; feedback: string }>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const base = kind === "homework" ? "/ops/homework/submissions" : "/ops/assignments/submissions";
  const idParam = kind === "homework" ? "homeworkId" : "assignmentId";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`${base}?${idParam}=${itemId}`);
      setRows(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not load submissions.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
  };

  const save = async (row: any) => {
    setError("");
    const d = draft[row._id] || { marks: row.marksObtained?.toString() ?? "", feedback: row.feedback ?? "" };
    try {
      if (kind === "assignment") {
        if (d.marks === "") return setError("Enter the marks first.");
        await api.put(`${base}/${row._id}`, { marksObtained: Number(d.marks), feedback: d.feedback });
      } else {
        await api.put(`${base}/${row._id}`, { feedback: d.feedback });
      }
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not save.");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button onClick={toggle} className="text-primary text-xs font-medium">{open ? "Hide submissions" : "View submissions"}</button>
      {open && (
        <div className="mt-2 space-y-2">
          {error && <p className="text-danger text-xs">{error}</p>}
          {loading && <p className="text-muted text-xs">Loading...</p>}
          {!loading && rows.length === 0 && <p className="text-muted text-xs">Nobody has submitted yet.</p>}
          {rows.map((r) => {
            const d = draft[r._id] || { marks: r.marksObtained?.toString() ?? "", feedback: r.feedback ?? "" };
            const done = r.status === "GRADED" || r.status === "COMPLETED";
            return (
              <div key={r._id} className="border border-border rounded-md p-3 text-sm flex flex-wrap items-center gap-3">
                <span className="font-medium text-ink">{r.studentId?.userId?.name || "Student"} <span className="text-muted text-xs">({r.studentId?.admissionNumber})</span></span>
                {r.submissionUrl && <a href={r.submissionUrl} target="_blank" rel="noreferrer" className="text-primary text-xs underline">Open file</a>}
                <span className="text-xs text-muted">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}</span>
                {kind === "assignment" && (
                  <input type="number" min={0} max={totalMarks} placeholder={totalMarks ? `/ ${totalMarks}` : "Marks"} value={d.marks}
                    onChange={(e) => setDraft({ ...draft, [r._id]: { ...d, marks: e.target.value } })}
                    className="w-24 border border-border rounded-md px-2 py-1 text-xs" />
                )}
                <input placeholder="Feedback (optional)" value={d.feedback}
                  onChange={(e) => setDraft({ ...draft, [r._id]: { ...d, feedback: e.target.value } })}
                  className="flex-1 min-w-[140px] border border-border rounded-md px-2 py-1 text-xs" />
                <button onClick={() => save(r)} className="bg-primary text-white px-3 py-1 rounded-md text-xs">
                  {done ? "Update" : kind === "assignment" ? "Save marks" : "Mark checked"}
                </button>
                {done && <span className="text-success text-xs font-medium">{r.status === "GRADED" ? "Marked" : "Checked"}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
