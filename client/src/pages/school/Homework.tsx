import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { ClipboardCheck } from "lucide-react";

// View-only: homework is assigned by the teacher (Teacher > Homework), not
// created a second time from the admin side. This page lets admin monitor
// what's been assigned, by class.
export default function Homework() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
  }, [schoolId]);

  useEffect(() => {
    if (classId) {
      api.get(`/academics/sections?classId=${classId}`).then((res) => setSections(res.data));
      api.get(`/ops/homework?classId=${classId}`).then((res) => setList(res.data));
    } else {
      setSections([]);
      setList([]);
    }
    setSectionId("");
  }, [classId]);

  const visible = sectionId ? list.filter((h) => h.sectionId === sectionId) : list;

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Daily Records</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><ClipboardCheck size={22} className="text-primary" />Homework</h1>
        <p className="text-muted mt-1 text-sm">What teachers have assigned, by class.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-wrap gap-3">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm min-w-[160px]">
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm min-w-[160px]" disabled={!classId}>
          <option value="">All Sections</option>
          {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-3 mt-6">
        {!classId && <p className="text-muted text-sm">Select a class to see homework.</p>}
        {classId && visible.length === 0 && <p className="text-muted text-sm">Nothing assigned here yet.</p>}
        {visible.map((h) => (
          <div key={h._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-primary-dark">{h.title}</h3>
              <span className="text-xs text-muted">Due {new Date(h.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted mt-1">{h.description}</p>
            {h.attachmentUrl && (
              <a href={h.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 inline-block">
                View Attachment
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
