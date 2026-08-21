import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";

export default function TeacherPTM() {
  const teacher = useMyTeacherRecord();
  const [slots, setSlots] = useState<any[]>([]);
  const [form, setForm] = useState({ date: "", time: "" });
  const [hours, setHours] = useState("");

  const load = async () => {
    if (teacher?._id) {
      const res = await api.get(`/comm/ptm-slots/by-teacher?teacherId=${teacher._id}`);
      setSlots(res.data);
    }
  };

  useEffect(() => {
    load();
    if (teacher?.communicationHours) setHours(teacher.communicationHours);
  }, [teacher]);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/comm/ptm-slots", { schoolId: teacher.schoolId, teacherId: teacher._id, ...form });
    setForm({ date: "", time: "" });
    load();
  };

  const saveHours = async () => {
    await api.put(`/comm/teachers/${teacher._id}/communication-hours`, { communicationHours: hours });
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Meetings & Availability</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">PTM Slots & Communication Hours</h1>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-2">Communication Hours</h2>
        <p className="text-xs text-muted mb-3">Let parents know when you typically respond to messages.</p>
        <div className="flex gap-2">
          <input placeholder="e.g. Mon-Fri 4:00 PM - 5:00 PM" value={hours} onChange={(e) => setHours(e.target.value)} className="flex-1 border border-border rounded-md px-3 py-2 text-sm" />
          <button onClick={saveHours} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">Save</button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
        <h2 className="font-display font-semibold text-primary-dark mb-3">Add PTM Slot</h2>
        <form onSubmit={addSlot} className="flex gap-2 mb-4">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Time e.g. 10:00 AM" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">+ Add Slot</button>
        </form>
        <ul className="text-sm divide-y divide-black/5">
          {slots.length === 0 && <li className="py-2 text-muted">No slots created yet.</li>}
          {slots.map((s) => (
            <li key={s._id} className="py-2 flex justify-between">
              <span>{new Date(s.date).toLocaleDateString()} at {s.time}</span>
              <span className={`text-xs ${s.isBooked ? "text-accent" : "text-muted"}`}>{s.isBooked ? `Booked by ${s.parentId?.userId?.name || "parent"}` : "Available"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
