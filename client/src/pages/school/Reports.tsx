import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Papa from "papaparse";

export default function Reports() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) {
      api.get(`/reports/summary?schoolId=${schoolId}`).then((res) => setSummary(res.data));
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
      api.get(`/people/teachers?schoolId=${schoolId}`).then((res) => setTeachers(res.data));
    }
  }, [schoolId]);

  const downloadCSV = (rows: any[], filename: string) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const exportStudentsCSV = () => {
    downloadCSV(
      students.map((s) => ({
        name: s.userId?.name,
        email: s.userId?.email,
        admissionNumber: s.admissionNumber,
        class: s.classId?.name || "",
        status: s.status,
      })),
      "students-export.csv"
    );
  };

  const exportTeachersCSV = () => {
    downloadCSV(
      teachers.map((t) => ({
        name: t.userId?.name,
        email: t.userId?.email,
        employeeId: t.employeeId,
        qualification: t.qualification || "",
        employmentStatus: t.employmentStatus,
      })),
      "teachers-export.csv"
    );
  };

  const exportFeesCSV = async () => {
    const res = await api.get(`/ops/invoices/all?schoolId=${schoolId}`);
    const rows = res.data.map((i: any) => ({
      student: i.studentId?.userId?.name || "",
      feeType: i.feeType,
      amount: i.amount,
      paidAmount: i.paidAmount || 0,
      status: i.status,
      dueDate: i.dueDate,
    }));
    downloadCSV(rows, "fees-export.csv");
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Insights</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">Reports & Analytics</h1>
        <p className="text-muted mt-1 text-sm">Overview of school-wide statistics with export options.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Total Students</p>
            <p className="text-2xl font-display font-bold text-ink mt-1">{summary.totalStudents}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Results Recorded</p>
            <p className="text-2xl font-display font-bold text-ink mt-1">{summary.totalResultsRecorded}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Classes</p>
            <p className="text-2xl font-display font-bold text-ink mt-1">{Object.keys(summary.classCounts).length}</p>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
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

      {summary?.classPerformance?.length > 0 && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
          <h2 className="font-display font-semibold text-ink mb-3">Class Performance (Average Score)</h2>
          <div className="space-y-2">
            {summary.classPerformance.map((c: any) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-sm w-32">{c.name}</span>
                <div className="flex-1 h-2 bg-canvas rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${c.averagePercent}%` }} />
                </div>
                <span className="text-xs text-muted w-10 text-right">{c.averagePercent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary?.subjectPerformance?.length > 0 && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
          <h2 className="font-display font-semibold text-ink mb-3">Subject Performance (Average Score)</h2>
          <div className="space-y-2">
            {summary.subjectPerformance.map((s: any) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-sm w-32">{s.name}</span>
                <div className="flex-1 h-2 bg-canvas rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full" style={{ width: `${s.averagePercent}%` }} />
                </div>
                <span className="text-xs text-muted w-10 text-right">{s.averagePercent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary?.gradeDistribution && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <h2 className="font-display font-semibold text-ink mb-3">Grade Distribution</h2>
            <div className="flex gap-2">
              {Object.entries(summary.gradeDistribution).map(([grade, count]: any) => (
                <div key={grade} className="flex-1 text-center">
                  <div className="bg-canvas rounded-lg py-3">
                    <p className="text-lg font-display font-bold text-ink">{count}</p>
                    <p className="text-[10px] text-muted">{grade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <h2 className="font-display font-semibold text-ink mb-3">Admission Funnel</h2>
            <div className="space-y-1.5">
              {summary.admissionFunnel?.map((f: any) => (
                <div key={f.status} className="flex justify-between text-xs">
                  <span className="text-ink-soft">{f.status}</span>
                  <span className="text-ink font-medium">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-ink mb-3">Export Data</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportStudentsCSV} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            Export Students List (CSV)
          </button>
          <button onClick={exportTeachersCSV} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            Export Teachers List (CSV)
          </button>
          <button onClick={exportFeesCSV} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            Export Fee Ledger (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

