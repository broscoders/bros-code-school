import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Announcements() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", targetAudience: "ALL" });

  const load = async () => {
    const res = await api.get(`/extra/announcements?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/extra/announcements", { ...form, schoolId, createdBy: userId });
    setForm({ title: "", message: "", targetAudience: "ALL" });
    load();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Announcements</h1>
      <p className="text-slate-500 mt-1">Publish announcements to your school community.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-5 mt-6 space-y-3">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" required />
        <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" rows={3} required />
        <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
          <option value="ALL">Everyone</option>
          <option value="PARENTS">Parents</option>
          <option value="STUDENTS">Students</option>
          <option value="TEACHERS">Teachers</option>
        </select>
        <button className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm block">+ Publish</button>
      </form>

      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-slate-400 text-sm">No announcements yet.</p>}
        {list.map((a) => (
          <div key={a._id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold text-slate-800">{a.title}</h3>
              <span className="text-xs text-slate-400">{a.targetAudience}</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
