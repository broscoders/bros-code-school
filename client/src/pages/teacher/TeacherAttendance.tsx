import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { CalendarCheck } from "lucide-react";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";

export default function TeacherAttendance() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const teacher = useMyTeacherRecord();
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (classId) {
      api.get(`/academics/sections?classId=${classId}`).then((res) => setSections(res.data));
      api.get(`/people/students?schoolId=${schoolId}`).then((res) =>
        setStudents(res.data.filter((s: any) => s.classId === classId || s.classId?._id === classId))
      );
    }
  }, [classId]);

  const markAll = async () => {
    if (!date) {
      setMsg("Please select a date first.");
      return;
    }
    await Promise.all(
      students.map((s) =>
        api.post("/ops/attendance", {
          schoolId,
          studentId: s._id,
          classId,
          sectionId,
          date,
          status: statusMap[s._id] || "PRESENT",
          markedBy: userId,
        })
      )
    );
    setMsg("Attendance saved for all students.");
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <div className="p-8">
      <p className="section-label">Teaching</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><CalendarCheck size={22} className="text-primary" />Attendance</h1>
      <p className="text-muted mt-1 text-sm">Mark attendance for your assigned classes.</p>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm">
            <option value="">Select Class</option>
            {teacher?.assignedClasses?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm" disabled={!classId}>
            <option value="">Select Section</option>
            {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm" />
        </div>

        {msg && <p className="text-success text-sm mb-3">{msg}</p>}

        {students.length > 0 && (
          <div className="space-y-2">
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
            <button onClick={markAll} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium mt-3 hover:bg-primary-light transition-colors">
              Save Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
