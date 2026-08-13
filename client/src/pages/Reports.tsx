import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import Papa from "papaparse";

export default function Reports() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) {
      api.get(`/reports/summary?schoolId=${schoolId}`).then((res) => setSummary(res.data));
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
    }
  }, [schoolId]);

  const exportStudentsCSV = () => {
    const rows = students.map((s) => ({
      name: s.userId?.name,
      email: s.userId?.email,
      admissionNumber: s.admissionNumber,
      class: s.classId?.name || "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students-export.csv";
    a.click();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Insights</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Reports & Analytics</h1>
      <p className="text-muted mt-1 text-sm">Overview of school-wide statistics with export options.</p>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
            <p className="text-xs text-muted">Total Students</p>
            <p className="text-2xl font-display font-bold text-ink mt-1">{summary.totalStudents}</p>
          </div>
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
            <p className="text-xs text-muted">Results Recorded</p>
            <p className="text-2xl font-display font-bold text-ink mt-1">{summary.totalResultsRecorded}</p>
          </div>
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
            <p className="text-xs text-muted">Classes</p>
            <p className="text-2xl font-display font-bold text-ink mt-1">{Object.keys(summary.classCounts).length}</p>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 mt-6">
          <h2 className="font-display font-semibold text-ink mb-3">Students by Class</h2>
          <div className="space-y-2">
            {Object.entries(summary.classCounts).map(([className, count]: any) => (
              <div key={className} className="flex items-center gap-3">
                <span className="text-sm w-32">{className}</span>
                <div className="flex-1 h-2 bg-canvas rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(count / summary.totalStudents) * 100}%` }} />
                </div>
                <span className="text-xs text-muted w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-ink mb-3">Export Data</h2>
        <button onClick={exportStudentsCSV} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          Export Students List (CSV)
        </button>
      </div>
    </div>
  );
}
