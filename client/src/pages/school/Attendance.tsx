import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { CalendarCheck, FileSpreadsheet } from "lucide-react";
import { exportAttendanceRegister } from "../../utils/excelExport";

const statusColors: Record<string, string> = {
  PRESENT: "bg-success-soft text-success",
  ABSENT: "bg-danger-soft text-danger",
  LATE: "bg-warning-soft text-warning",
  LEAVE: "bg-primary/12 text-primary",
};

// Admin view of attendance. This is a REPORT, not a marking tool - marking
// attendance is the teacher's job (Teacher > Attendance). Admin sees what
// was recorded, same as a principal would check the register, rather than
// a duplicate "mark everyone present then save" form (which also used to
// default every student to PRESENT without checking what the teacher had
// already recorded - opening this page and hitting Save would have silently
// overwritten the real attendance for the day).
export default function Attendance() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
    if (!sectionId || !date) { setStudents([]); return; }
    setLoading(true);
    const [year, month] = date.split("-").map(Number);
    api.get(`/ops/attendance/register?sectionId=${sectionId}&month=${month}&year=${year}`)
      .then((res) => {
        const { students: regStudents, records } = res.data;
        setStudents(regStudents);
        const map: Record<string, string> = {};
        records
          .filter((r: any) => new Date(r.date).toISOString().slice(0, 10) === date)
          .forEach((r: any) => { map[r.studentId] = r.status; });
        setStatusMap(map);
      })
      .finally(() => setLoading(false));
  }, [sectionId, date]);

  const presentCount = Object.values(statusMap).filter((v) => v === "PRESENT").length;
  const absentCount = Object.values(statusMap).filter((v) => v === "ABSENT").length;
  const markedCount = Object.keys(statusMap).length;

  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  // Blueprint 34/70: a printable/shareable monthly register - students as
  // rows, every day of the month as its own column - matching the paper
  // attendance register format schools already use, so it's usable
  // as-is at month-end rather than needing to be rebuilt from raw records.
  const downloadRegister = async () => {
    if (!sectionId) return;
    setExporting(true);
    try {
      const res = await api.get(`/ops/attendance/register?sectionId=${sectionId}&month=${exportMonth}&year=${exportYear}`);
      const { students: regStudents, records } = res.data;
      const daysInMonth = new Date(exportYear, exportMonth, 0).getDate();

      const statusCode: Record<string, string> = { PRESENT: "P", ABSENT: "A", LATE: "L", LEAVE: "LV" };
      const byStudent: Record<string, string[]> = {};
      regStudents.forEach((s: any) => { byStudent[s.id] = new Array(daysInMonth).fill(""); });
      records.forEach((r: any) => {
        const day = new Date(r.date).getUTCDate();
        if (byStudent[r.studentId]) byStudent[r.studentId][day - 1] = statusCode[r.status] || "";
      });

      const className = classes.find((c) => c._id === classId)?.name || "";
      const sectionName = sections.find((s) => s._id === sectionId)?.name || "";
      await exportAttendanceRegister(
        `Attendance-${className}${sectionName}-${exportMonth}-${exportYear}`,
        `${className} ${sectionName}`,
        regStudents.map((s: any) => ({ name: s.name, admissionNumber: s.admissionNumber })),
        daysInMonth,
        regStudents.map((s: any) => byStudent[s.id])
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Operations</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <CalendarCheck size={22} className="text-primary" />
          Attendance
        </h1>
        <p className="text-muted mt-1 text-sm">What teachers have recorded, by class and date.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-wrap gap-3 items-end">
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

      {sectionId && (
        <div className="bg-canvas rounded-xl border border-border p-4 mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Register month</label>
            <select value={exportMonth} onChange={(e) => setExportMonth(Number(e.target.value))} className="text-sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString(undefined, { month: "long" })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Year</label>
            <select value={exportYear} onChange={(e) => setExportYear(Number(e.target.value))} className="text-sm">
              {[exportYear - 1, exportYear, exportYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={downloadRegister} disabled={exporting} className="flex items-center gap-2 bg-surface border border-border text-ink px-4 py-2 rounded-md text-sm font-medium hover:bg-white disabled:opacity-60">
            <FileSpreadsheet size={15} />
            {exporting ? "Preparing..." : "Download Monthly Register (Excel)"}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-muted mt-4">Loading...</p>}

      {!loading && sectionId && students.length > 0 && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
            <span className="text-success font-medium">{presentCount} Present</span>
            <span className="text-danger font-medium">{absentCount} Absent</span>
            <span className="text-muted">{students.length} Total</span>
            {markedCount === 0 && <span className="text-muted">· Not marked yet for this date</span>}
          </div>

          <div className="divide-y divide-border">
            {students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-display font-semibold">
                    {s.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-ink font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted">{s.admissionNumber}</p>
                  </div>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusMap[s.id] ? statusColors[statusMap[s.id]] : "bg-white/5 text-muted"}`}>
                  {statusMap[s.id] ? statusMap[s.id].charAt(0) + statusMap[s.id].slice(1).toLowerCase() : "Not marked"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && sectionId && students.length === 0 && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-8 mt-4 text-center text-muted text-sm">
          No active students found in this section.
        </div>
      )}
    </div>
  );
}
