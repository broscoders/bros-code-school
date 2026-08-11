import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Homework() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ classId: "", sectionId: "", subjectId: "", teacherId: "", title: "", description: "", dueDate: "" });

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
      api.get(`/ops/homework?classId=${form.classId}`).then((res) => setList(res.data));
    } else {
      setSections([]);
      setSubjects([]);
      setList([]);
    }
  }, [form.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/homework", { ...form, schoolId });
    setForm({ ...form, title: "", description: "", dueDate: "" });
    const res = await api.get(`/ops/homework?classId=${form.classId}`);
    setList(res.data);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academics</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Homework</h1>
      <p className="text-muted mt-1 text-sm">Assign and track homework by class.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "", subjectId: "" })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
          <option value="">Select Section</option>
          {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
          <option value="">Select Subject</option>
          {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Teacher</option>
          {teachers.map((t) => <option key={t._id} value={t._id}>{t.userId?.name}</option>)}
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" rows={2} />
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Assign Homework</button>
      </form>

      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">Select a class to see homework, or none assigned yet.</p>}
        {list.map((h) => (
          <div key={h._id} className="bg-surface rounded-xl border border-black/5 shadow-sm p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-primary-dark">{h.title}</h3>
              <span className="text-xs text-muted">Due {new Date(h.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted mt-1">{h.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
