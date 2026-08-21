import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Assignments() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ classId: "", sectionId: "", subjectId: "", teacherId: "", title: "", instructions: "", totalMarks: "", dueDate: "" });

  useEffect(() => {
    if (schoolId) {
      api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
      api.get(`/people/teachers?schoolId=${schoolId}`).then((res) => setTeachers(res.data));
    }
  }, [schoolId]);

  useEffect(() => {
    if (form.classId) {
      api.get(`/academics/sections?classId=${form.classId}`).then((res) => setSections(res.data));
      api.get(`/academics/subjects?classId=${form.classId}`).then((res) => setSubjects(res.data));
      api.get(`/ops/assignments?classId=${form.classId}`).then((res) => setList(res.data));
    } else {
      setSections([]);
      setSubjects([]);
      setList([]);
    }
  }, [form.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/assignments", { ...form, schoolId });
    setForm({ ...form, title: "", instructions: "", totalMarks: "", dueDate: "" });
    const res = await api.get(`/ops/assignments?classId=${form.classId}`);
    setList(res.data);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academics</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Assignments</h1>
      <p className="text-muted mt-1 text-sm">Create and track assignments by class.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "", subjectId: "" })} className="border border-border rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
          <option value="">Select Section</option>
          {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
          <option value="">Select Subject</option>
          {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Teacher</option>
          {teachers.map((t) => <option key={t._id} value={t._id}>{t.userId?.name}</option>)}
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required />
        <textarea placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" rows={2} />
        <input type="number" placeholder="Total Marks" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Create Assignment</button>
      </form>

      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">Select a class to see assignments, or none created yet.</p>}
        {list.map((a) => (
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

