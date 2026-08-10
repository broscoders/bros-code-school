import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Academics() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sessionForm, setSessionForm] = useState({ name: "", startDate: "", endDate: "" });
  const [classForm, setClassForm] = useState({ sessionId: "", name: "", academicSystem: "" });

  const load = async () => {
    const s = await api.get(`/academics/sessions?schoolId=${schoolId}`);
    setSessions(s.data);
    const c = await api.get(`/academics/classes?schoolId=${schoolId}`);
    setClasses(c.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/academics/sessions", { ...sessionForm, schoolId });
    setSessionForm({ name: "", startDate: "", endDate: "" });
    load();
  };

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/academics/classes", { ...classForm, schoolId });
    setClassForm({ sessionId: "", name: "", academicSystem: "" });
    load();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Academic Structure</h1>
      <p className="text-slate-500 mt-1">Manage sessions, classes and academic systems.</p>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Academic Sessions</h2>
          <form onSubmit={addSession} className="space-y-2 mb-4">
            <input placeholder="Session Name (e.g. 2026-2027)" value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" required />
            <div className="flex gap-2">
              <input type="date" value={sessionForm.startDate} onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" required />
              <input type="date" value={sessionForm.endDate} onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" required />
            </div>
            <button className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm w-full">+ Add Session</button>
          </form>
          <ul className="text-sm space-y-1">
            {sessions.map((s) => (
              <li key={s._id} className="flex justify-between border-b py-1">
                <span>{s.name}</span>
                <span className="text-slate-400 text-xs">{s._id}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Classes</h2>
          <form onSubmit={addClass} className="space-y-2 mb-4">
            <select value={classForm.sessionId} onChange={(e) => setClassForm({ ...classForm, sessionId: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Session</option>
              {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input placeholder="Class Name (e.g. Grade 9-A)" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Academic System (e.g. Matric)" value={classForm.academicSystem} onChange={(e) => setClassForm({ ...classForm, academicSystem: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" required />
            <button className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm w-full">+ Add Class</button>
          </form>
          <ul className="text-sm space-y-1">
            {classes.map((c) => (
              <li key={c._id} className="flex justify-between border-b py-1">
                <span>{c.name} ({c.academicSystem})</span>
                <span className="text-slate-400 text-xs">{c._id}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
