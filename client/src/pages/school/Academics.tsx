import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Academics() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sessionForm, setSessionForm] = useState({ name: "", startDate: "", endDate: "" });
  const [sessionMsg, setSessionMsg] = useState("");
  const [classForm, setClassForm] = useState({ sessionId: "", name: "", academicSystem: "" });
  const [sectionForm, setSectionForm] = useState({ classId: "", name: "", capacity: "" });

  const load = async () => {
    const s = await api.get(`/academics/sessions?schoolId=${schoolId}`);
    setSessions(s.data);
    const c = await api.get(`/academics/classes?schoolId=${schoolId}`);
    setClasses(c.data);
  };

  const loadSectionsForClass = async (classId: string) => {
    if (!classId) {
      setSections([]);
      return;
    }
    const res = await api.get(`/academics/sections?classId=${classId}`);
    setSections(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  useEffect(() => {
    loadSectionsForClass(sectionForm.classId);
  }, [sectionForm.classId]);

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionMsg("");
    try {
      await api.post("/academics/sessions", { ...sessionForm, schoolId });
      setSessionForm({ name: "", startDate: "", endDate: "" });
      load();
    } catch (err: any) {
      setSessionMsg(err.response?.data?.message || "Could not create session");
    }
  };

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/academics/classes", { ...classForm, schoolId });
    setClassForm({ sessionId: "", name: "", academicSystem: "" });
    load();
  };

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.classId) return;
    await api.post("/academics/sections", {
      schoolId,
      classId: sectionForm.classId,
      name: sectionForm.name,
    });
    setSectionForm({ classId: sectionForm.classId, name: "", capacity: "" });
    loadSectionsForClass(sectionForm.classId);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Configuration</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Academic Structure</h1>
      <p className="text-muted mt-1 text-sm">Manage sessions, classes, sections and academic systems.</p>

      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Academic Sessions</h2>
          <form onSubmit={addSession} className="space-y-2 mb-4">
          {sessionMsg && <p className="text-xs text-danger">{sessionMsg}</p>}
            <input placeholder="Session Name (e.g. 2026-2027)" value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <div className="flex gap-2">
              <input type="date" value={sessionForm.startDate} onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
              <input type="date" value={sessionForm.endDate} onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            </div>
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Session</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {sessions.length === 0 && <li className="py-2 text-muted">No sessions yet.</li>}
            {sessions.map((s) => (
              <li key={s._id} className="flex justify-between py-2">
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Classes</h2>
          <form onSubmit={addClass} className="space-y-2 mb-4">
            <select value={classForm.sessionId} onChange={(e) => setClassForm({ ...classForm, sessionId: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Session</option>
              {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input placeholder="Class Name (e.g. Grade 9-A)" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Academic System (e.g. Matric)" value={classForm.academicSystem} onChange={(e) => setClassForm({ ...classForm, academicSystem: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Class</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {classes.length === 0 && <li className="py-2 text-muted">No classes yet.</li>}
            {classes.map((c) => (
              <li key={c._id} className="flex justify-between py-2">
                <span>{c.name}</span>
                <span className="text-muted text-xs">{c.academicSystem}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Sections</h2>
          <form onSubmit={addSection} className="space-y-2 mb-4">
            <select value={sectionForm.classId} onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input placeholder="Section Name (e.g. A)" value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <input type="number" placeholder="Capacity (optional, e.g. 40)" value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Section</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {!sectionForm.classId && <li className="py-2 text-muted">Select a class to view/add sections.</li>}
            {sectionForm.classId && sections.length === 0 && <li className="py-2 text-muted">No sections yet.</li>}
            {sections.map((s) => (
              <li key={s._id} className="flex justify-between py-2">
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


