import { useEffect, useState } from "react";
import api from "../services/api";
import { X } from "lucide-react";

interface Props {
  schoolId?: string;
  onClose: () => void;
}

export default function PromoteStudentsModal({ schoolId, onClose }: Props) {
  const [mode, setMode] = useState<"promote" | "graduate">("promote");
  const [classes, setClasses] = useState<any[]>([]);
  const [fromSections, setFromSections] = useState<any[]>([]);
  const [toSections, setToSections] = useState<any[]>([]);
  const [fromClassId, setFromClassId] = useState("");
  const [fromSectionId, setFromSectionId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [toSectionId, setToSectionId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (schoolId) api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
  }, [schoolId]);

  useEffect(() => {
    setFromSectionId("");
    setStudents([]);
    setSelected(new Set());
    if (fromClassId) api.get(`/academics/sections?classId=${fromClassId}`).then((res) => setFromSections(res.data));
  }, [fromClassId]);

  useEffect(() => {
    if (toClassId) api.get(`/academics/sections?classId=${toClassId}`).then((res) => setToSections(res.data));
    else setToSections([]);
    setToSectionId("");
  }, [toClassId]);

  useEffect(() => {
    if (fromSectionId && schoolId) {
      api.get(`/people/students?schoolId=${schoolId}&status=ACTIVE`).then((res) => {
        const list = res.data.filter((s: any) => (s.sectionId?._id || s.sectionId) === fromSectionId);
        setStudents(list);
        setSelected(new Set());
      });
    }
  }, [fromSectionId]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s._id)));
  };

  const submit = async () => {
    if (selected.size === 0) {
      setMsg("Select at least one student");
      return;
    }
    if (mode === "promote" && (!toClassId || !toSectionId)) {
      setMsg("Select a destination class and section");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      if (mode === "promote") {
        const res = await api.post("/academics/promote", {
          studentIds: Array.from(selected),
          toClassId,
          toSectionId,
        });
        setMsg(res.data.message);
      } else {
        const res = await api.post("/academics/graduate", { studentIds: Array.from(selected) });
        setMsg(res.data.message);
      }
      setSelected(new Set());
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-ink">Promote / Graduate Students</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("promote")}
            className={`flex-1 text-sm py-2 rounded-lg font-medium ${mode === "promote" ? "bg-primary text-white" : "bg-white/5 text-muted"}`}
          >
            Promote to Next Class
          </button>
          <button
            onClick={() => setMode("graduate")}
            className={`flex-1 text-sm py-2 rounded-lg font-medium ${mode === "graduate" ? "bg-primary text-white" : "bg-white/5 text-muted"}`}
          >
            Graduate (Alumni)
          </button>
        </div>

        <p className="text-xs text-muted mb-1">From (current class)</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select value={fromClassId} onChange={(e) => setFromClassId(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={fromSectionId} onChange={(e) => setFromSectionId(e.target.value)} disabled={!fromClassId}>
            <option value="">Select Section</option>
            {fromSections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        {mode === "promote" && (
          <>
            <p className="text-xs text-muted mb-1">To (destination class)</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select value={toClassId} onChange={(e) => setToClassId(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select value={toSectionId} onChange={(e) => setToSectionId(e.target.value)} disabled={!toClassId}>
                <option value="">Select Section</option>
                {toSections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}

        {students.length > 0 && (
          <div className="border border-border rounded-lg mt-3">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-white/5">
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input type="checkbox" checked={selected.size === students.length} onChange={toggleAll} />
                Select all ({students.length})
              </label>
              <span className="text-xs text-muted">{selected.size} selected</span>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-border">
              {students.map((s) => (
                <label key={s._id} className="flex items-center gap-2 px-3 py-2 text-sm text-ink cursor-pointer hover:bg-white/5">
                  <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggle(s._id)} />
                  {s.userId?.name} <span className="text-muted text-xs">({s.admissionNumber})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {msg && <p className={`text-xs mt-3 ${msg.toLowerCase().includes("select") || msg.toLowerCase().includes("failed") ? "text-danger" : "text-success"}`}>{msg}</p>}

        <button
          onClick={submit}
          disabled={submitting || students.length === 0}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold mt-4 disabled:opacity-60 hover:bg-primary-dark transition-colors"
        >
          {submitting ? "Processing..." : mode === "promote" ? "Promote Selected" : "Graduate Selected"}
        </button>
      </div>
    </div>
  );
}