import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { CalendarCheck, Check } from "lucide-react";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "LEAVE"];
const statusColors: Record<string, string> = {
  PRESENT: "bg-success text-white",
  ABSENT: "bg-danger text-white",
  LATE: "bg-warning text-white",
  LEAVE: "bg-primary text-white",
};

export default function Attendance() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (schoolId) api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
  }, [schoolId]);

  useEffect(() => {
    if (classId) {
      api.get(`/academics/sections?classId=${classId}`).then((res) => setSections(res.data));
    } else {
      setSections([]);
    }
    setSectionId("");
    setStudents([]);
  }, [classId]);

  useEffect(() => {
    if (sectionId) {
      api.get(`/people/students?schoolId=${schoolId}&status=ACTIVE`).then((res) => {
        const list = res.data.filter((s: any) => (s.sectionId?._id || s.sectionId) === sectionId);
        setStudents(list);
        const initial: Record<string, string> = {};
        list.forEach((s: any) => (initial[s._id] = "PRESENT"));
        setStatusMap(initial);
      });
    } else {
      setStudents([]);
    }
  }, [sectionId]);

  const setAll = (status: string) => {
    const next: Record<string, string> = {};
    students.forEach((s) => (next[s._id] = status));
    setStatusMap(next);
  };

  const saveAttendance = async () => {
    setSaving(true);
    setMsg("");
    try {
      const records = students.map((s) => ({ studentId: s._id, status: statusMap[s._id] || "PRESENT" }));
      const res = await api.post("/ops/attendance/bulk", { classId, sectionId, date, records });
      setMsg(`Saved attendance for ${res.data.marked} students.`);
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const presentCount = Object.values(statusMap).filter((v) => v === "PRESENT").length;
  const absentCount = Object.values(statusMap).filter((v) => v === "ABSENT").length;

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Operations</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
        <CalendarCheck size={22} className="text-primary" />
        Attendance
      </h1>
      <p className="text-muted mt-1 text-sm">Mark attendance for a whole class at once.</p>

      <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 mt-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-muted mb-1">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full">
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-muted mb-1">Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full" disabled={!classId}>
            <option value="">Select Section</option>
            {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-muted mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
        </div>
      </div>

      {students.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex gap-3 text-sm">
              <span className="text-success font-medium">{presentCount} Present</span>
              <span className="text-danger font-medium">{absentCount} Absent</span>
              <span className="text-muted">{students.length} Total</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAll("PRESENT")} className="text-xs px-3 py-1.5 rounded-full bg-success-soft text-success font-medium">
                Mark All Present
              </button>
              <button onClick={() => setAll("ABSENT")} className="text-xs px-3 py-1.5 rounded-full bg-danger-soft text-danger font-medium">
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {students.map((s) => (
              <div key={s._id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-display font-semibold">
                    {s.userId?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-ink font-medium">{s.userId?.name}</p>
                    <p className="text-[11px] text-muted">{s.admissionNumber}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStatusMap({ ...statusMap, [s._id]: opt })}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                        statusMap[s._id] === opt ? statusColors[opt] : "bg-white/5 text-muted hover:bg-white/10"
                      }`}
                    >
                      {opt === "PRESENT" && statusMap[s._id] === opt && <Check size={10} className="inline mr-0.5" />}
                      {opt.charAt(0) + opt.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {msg && <p className={`text-sm mt-4 ${msg.includes("Saved") ? "text-success" : "text-danger"}`}>{msg}</p>}

          <button
            onClick={saveAttendance}
            disabled={saving}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold mt-4 hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      )}

      {sectionId && students.length === 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-8 mt-4 text-center text-muted text-sm">
          No active students found in this section.
        </div>
      )}
    </div>
  );
}