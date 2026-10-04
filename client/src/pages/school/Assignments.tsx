import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { FileText } from "lucide-react";

// View-only: assignments are created by the teacher (Teacher > Assignments),
// not a second time from the admin side. This page lets admin monitor what's
// been set, by class.
export default function Assignments() {
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
      api.get(`/ops/assignments?classId=${classId}`).then((res) => setList(res.data));
    } else {
      setSections([]);
      setList([]);
    }
    setSectionId("");
  }, [classId]);

  const visible = sectionId ? list.filter((a) => a.sectionId === sectionId) : list;

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Daily Records</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><FileText size={22} className="text-primary" />Assignments</h1>
        <p className="text-muted mt-1 text-sm">What teachers have set, by class.</p>
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
        {!classId && <p className="text-muted text-sm">Select a class to see assignments.</p>}
        {classId && visible.length === 0 && <p className="text-muted text-sm">Nothing set here yet.</p>}
        {visible.map((a) => (
          <div key={a._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-primary-dark">{a.title}</h3>
              <span className="text-xs text-muted">Due {new Date(a.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted mt-1">{a.instructions}</p>
            {a.totalMarks && <p className="text-xs text-accent mt-1 font-semibold">Total Marks: {a.totalMarks}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
