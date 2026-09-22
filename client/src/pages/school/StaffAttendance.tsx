import { useEffect, useState } from "react";
import api from "../../services/api";
import { UserCheck, FileSpreadsheet } from "lucide-react";
import { exportAttendanceRegister } from "../../utils/excelExport";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"];
const statusColors: Record<string, string> = {
  PRESENT: "bg-success text-white",
  ABSENT: "bg-danger text-white",
  LATE: "bg-warning text-white",
  HALF_DAY: "bg-accent text-white",
  LEAVE: "bg-primary text-white",
};

export default function StaffAttendance() {
  const [roster, setRoster] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get("/hr/attendance/roster").then((res) => {
      setRoster(res.data);
      const initial: Record<string, string> = {};
      res.data.forEach((s: any) => (initial[s.userId] = "PRESENT"));
      setStatusMap(initial);
    });
  }, []);

  useEffect(() => {
    if (date) {
      api.get(`/hr/attendance?date=${date}`).then((res) => {
        if (res.data.length > 0) {
          const map: Record<string, string> = {};
          res.data.forEach((r: any) => (map[r.userId] = r.status));
          setStatusMap((prev) => ({ ...prev, ...map }));
        }
      });
    }
  }, [date]);

  const setAll = (status: string) => {
    const next: Record<string, string> = {};
    roster.forEach((s) => (next[s.userId] = status));
    setStatusMap(next);
  };

  const saveAttendance = async () => {
    setSaving(true);
    setMsg("");
    try {
      const records = roster.map((s) => ({ userId: s.userId, status: statusMap[s.userId] || "PRESENT" }));
      const res = await api.post("/hr/attendance", { date, records });
      setMsg(`Saved attendance for ${res.data.marked} staff members.`);
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const downloadRegister = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/hr/attendance/register?month=${exportMonth}&year=${exportYear}`);
      const daysInMonth = new Date(exportYear, exportMonth, 0).getDate();
      const statusCode: Record<string, string> = { PRESENT: "P", ABSENT: "A", LATE: "L", HALF_DAY: "HD", LEAVE: "LV" };

      const byUser: Record<string, string[]> = {};
      roster.forEach((s) => { byUser[s.userId] = new Array(daysInMonth).fill(""); });
      res.data.records.forEach((r: any) => {
        const day = new Date(r.date).getUTCDate();
        if (byUser[r.userId]) byUser[r.userId][day - 1] = statusCode[r.status] || "";
      });

      await exportAttendanceRegister(
        `Staff-Attendance-${exportMonth}-${exportYear}`,
        "Staff Attendance",
        roster.map((s) => ({ name: s.name, admissionNumber: s.employeeId })),
        daysInMonth,
        roster.map((s) => byUser[s.userId])
      );
    } finally {
      setExporting(false);
    }
  };

  const presentCount = Object.values(statusMap).filter((v) => v === "PRESENT").length;

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">HR</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <UserCheck size={22} className="text-primary" />Staff Attendance
        </h1>
        <p className="text-muted mt-1 text-sm">Mark daily attendance for teachers and other staff.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
        </div>
        <p className="text-sm text-muted">{presentCount} / {roster.length} present</p>
      </div>

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

      {roster.length > 0 && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
          <div className="flex gap-2 mb-4">
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => setAll(s)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColors[s]}`}>
                Mark All {s.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr><th className="p-2">Name</th><th className="p-2">Role</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody>
                {roster.map((s) => (
                  <tr key={s.userId} className="border-t border-border">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-muted">{s.role?.replace(/_/g, " ")}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setStatusMap({ ...statusMap, [s.userId]: opt })}
                            className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusMap[s.userId] === opt ? statusColors[opt] : "bg-canvas text-muted"}`}
                          >
                            {opt.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={saveAttendance} disabled={saving} className="mt-4 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
            {saving ? "Saving..." : "Save Attendance"}
          </button>
          {msg && <p className="text-sm text-success mt-2">{msg}</p>}
        </div>
      )}
    </div>
  );
}
