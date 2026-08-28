import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";
import { CalendarCheck } from "lucide-react";

export default function StudentAttendance() {
  const student = useMyStudentRecord();
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (student?._id) api.get(`/ops/attendance?studentId=${student._id}`).then((res) => setRecords(res.data));
  }, [student]);

  return (
    <div className="p-8">
      <p className="section-label">My School Life</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><CalendarCheck size={22} className="text-primary" />Attendance</h1>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={2} className="p-6 text-center text-muted">No records yet.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r._id} className="border-t border-border">
                  <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-3">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}