import { useEffect, useState } from "react";
import api from "../../services/api";
import { CalendarCheck } from "lucide-react";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";

type Student = { _id: string; admissionNumber?: string; userId?: { name?: string } };
type Section = { _id: string; name: string };
type ClassItem = { _id: string; name: string };

const today = () => new Date().toISOString().slice(0, 10);

export default function TeacherAttendance() {
  const teacher = useMyTeacherRecord();
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // A teacher with exactly one class gets it selected automatically;
  // with several classes they choose from the dropdown.
  useEffect(() => {
    const list: ClassItem[] = teacher?.assignedClasses || [];
    if (list.length === 1) setClassId(list[0]._id);
  }, [teacher]);

  // Sections of the chosen class
  useEffect(() => {
    setSectionId("");
    setStudents([]);
    setStatusMap({});
    if (!classId) {
      setSections([]);
      return;
    }
    api
      .get(`/academics/sections?classId=${classId}`)
      .then((res) => {
        setSections(res.data);
        if (res.data.length === 1) setSectionId(res.data[0]._id);
      })
      .catch(() => setSections([]));
  }, [classId]);

  // Students of the chosen section + whatever was already saved for that date
  useEffect(() => {
    setStatusMap({});
    if (!classId || !sectionId) {
      setStudents([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [stuRes, attRes] = await Promise.all([
          api.get(`/people/students?classId=${classId}&sectionId=${sectionId}`),
          date ? api.get(`/ops/attendance/section-day?classId=${classId}&sectionId=${sectionId}&date=${date}`) : Promise.resolve({ data: [] }),
        ]);
        if (cancelled) return;
        setStudents(stuRes.data);
        const saved: Record<string, string> = {};
        for (const r of attRes.data as { studentId: string; status: string }[]) saved[r.studentId] = r.status;
        setStatusMap(saved);
      } catch (err: any) {
        if (!cancelled) setMsg({ type: "err", text: err?.response?.data?.message || "Could not load students." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, sectionId, date]);

  const setAll = (status: string) => {
    const next: Record<string, string> = {};
    students.forEach((s) => (next[s._id] = status));
    setStatusMap(next);
  };

  const save = async () => {
    if (!date) return setMsg({ type: "err", text: "Please select a date first." });
    if (!classId || !sectionId) return setMsg({ type: "err", text: "Please select a class and section." });
    if (date > today()) return setMsg({ type: "err", text: "You cannot mark attendance for a future date." });
    setSaving(true);
    setMsg(null);
    try {
      const records = students.map((s) => ({ studentId: s._id, status: statusMap[s._id] || "PRESENT" }));
      const res = await api.post("/ops/attendance/bulk", { classId, sectionId, date, records });
      setMsg({ type: "ok", text: `Attendance saved for ${res.data.marked} student(s).` });
      // show the saved values (unmarked students were saved as PRESENT)
      setStatusMap(Object.fromEntries(records.map((r) => [r.studentId, r.status])));
    } catch (err: any) {
      setMsg({ type: "err", text: err?.response?.data?.message || "Attendance could not be saved. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const assigned: ClassItem[] = teacher?.assignedClasses || [];
  const counts = students.reduce<Record<string, number>>((acc, s) => {
    const st = statusMap[s._id] || "PRESENT";
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Teaching</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><CalendarCheck size={22} className="text-primary" />Attendance</h1>
        <p className="text-muted mt-1 text-sm">Mark attendance for your assigned classes.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        {teacher && assigned.length === 0 && (
          <p className="text-sm text-danger mb-3">No classes are assigned to you yet. Ask the school admin to assign your classes.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {assigned.length > 1 ? (
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm">
              <option value="">Select Class</option>
              {assigned.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          ) : (
            <div className="border border-border rounded-md px-3 py-2 text-sm bg-black/5">{assigned[0]?.name || "No class assigned"}</div>
          )}
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm" disabled={!classId}>
            <option value="">Select Section</option>
            {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm" />
        </div>

        {msg && <p className={`${msg.type === "ok" ? "text-success" : "text-danger"} text-sm mb-3`}>{msg.text}</p>}

        {classId && sectionId && students.length === 0 && <p className="text-muted text-sm">No active students in this section.</p>}

        {students.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
              <span className="text-xs text-muted mr-2">Mark all:</span>
              <button type="button" onClick={() => setAll("PRESENT")} className="text-xs border border-border rounded-md px-2 py-1 hover:bg-black/5">Present</button>
              <button type="button" onClick={() => setAll("ABSENT")} className="text-xs border border-border rounded-md px-2 py-1 hover:bg-black/5">Absent</button>
              <span className="text-xs text-muted ml-auto">
                P: {counts.PRESENT || 0} · A: {counts.ABSENT || 0} · L: {counts.LATE || 0} · Lv: {counts.LEAVE || 0}
              </span>
            </div>
            {students.map((s) => (
              <div key={s._id} className="flex justify-between items-center border-b border-border py-2">
                <span className="text-sm">{s.userId?.name} ({s.admissionNumber})</span>
                <select
                  value={statusMap[s._id] || "PRESENT"}
                  onChange={(e) => setStatusMap({ ...statusMap, [s._id]: e.target.value })}
                  className="text-xs border border-border rounded-md px-2 py-1"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>
            ))}
            <button onClick={save} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium mt-3 hover:bg-primary-light transition-colors disabled:opacity-60">
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
