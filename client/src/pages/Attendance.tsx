import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Attendance() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", classId: "", sectionId: "", date: "", status: "PRESENT" });
  const [records, setRecords] = useState<any[]>([]);
  const [lookupId, setLookupId] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (schoolId) api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
  }, [schoolId]);

  useEffect(() => {
    if (form.classId) {
      api.get(`/academics/sections?classId=${form.classId}`).then((res) => setSections(res.data));
      api.get(`/people/students?schoolId=${schoolId}`).then((res) =>
        setStudents(res.data.filter((s: any) => s.classId === form.classId || s.classId?._id === form.classId))
      );
    } else {
      setSections([]);
      setStudents([]);
    }
  }, [form.classId]);

  const markAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/attendance", { ...form, schoolId, markedBy: userId });
    setMsg("Attendance marked.");
    setTimeout(() => setMsg(""), 2000);
  };

  const loadRecords = async () => {
    const res = await api.get(`/ops/attendance?studentId=${lookupId}`);
    setRecords(res.data);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Operations</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Attendance</h1>
      <p className="text-muted mt-1 text-sm">Mark and review student attendance.</p>

      <form onSubmit={markAttendance} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        {msg && <p className="text-success text-sm col-span-2">{msg}</p>}
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "", studentId: "" })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
          <option value="">Select Section</option>
          {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required disabled={!form.classId}>
          <option value="">Select Student</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
        </select>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm">
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
          <option value="LEAVE">Leave</option>
        </select>
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">Mark Attendance</button>
      </form>

      <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-3">View Attendance History</h2>
        <div className="flex gap-2 mb-4">
          <select value={lookupId} onChange={(e) => setLookupId(e.target.value)} className="border border-black/10 rounded-md px-3 py-2 text-sm flex-1">
            <option value="">Select a student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
          </select>
          <button onClick={loadRecords} className="bg-primary-dark text-white px-4 py-2 rounded-md text-sm">Load</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-2 font-medium">Date</th><th className="p-2 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={2} className="p-4 text-center text-muted">No records loaded.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r._id} className="border-t border-black/5">
                  <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
