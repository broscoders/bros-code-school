import { useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Attendance() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [form, setForm] = useState({ studentId: "", classId: "", sectionId: "", date: "", status: "PRESENT" });
  const [records, setRecords] = useState<any[]>([]);
  const [lookupId, setLookupId] = useState("");

  const markAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/attendance", { ...form, schoolId, markedBy: userId });
    setForm({ ...form, status: "PRESENT" });
  };

  const loadRecords = async () => {
    const res = await api.get(`/ops/attendance?studentId=${lookupId}`);
    setRecords(res.data);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
      <p className="text-slate-500 mt-1">Mark and review student attendance.</p>

      <form onSubmit={markAttendance} className="bg-white rounded-lg shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <input placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Class ID" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Section ID" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border rounded-md px-3 py-2 text-sm col-span-2">
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
          <option value="LEAVE">Leave</option>
        </select>
        <button className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm col-span-2">Mark Attendance</button>
      </form>

      <div className="bg-white rounded-lg shadow-sm p-5 mt-6">
        <h2 className="font-semibold text-slate-800 mb-3">View Attendance History</h2>
        <div className="flex gap-2 mb-4">
          <input placeholder="Student ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} className="border rounded-md px-3 py-2 text-sm flex-1" />
          <button onClick={loadRecords} className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm">Load</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr><th className="p-2">Date</th><th className="p-2">Status</th></tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
