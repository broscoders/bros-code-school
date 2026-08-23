import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";

export default function StudentResults() {
  const student = useMyStudentRecord();
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (student?._id) api.get(`/ops/results?studentId=${student._id}`).then((res) => setResults(res.data));
  }, [student]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">My School Life</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Award size={22} className="text-primary" />Results</h1>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Exam</th><th className="p-3 font-medium">Marks</th><th className="p-3 font-medium">Grade</th></tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-muted">No results yet.</td></tr>
            ) : (
              results.map((r) => (
                <tr key={r._id} className="border-t border-border">
                  <td className="p-3">{r.examId?.name}</td>
                  <td className="p-3">{r.marksObtained} / {r.examId?.totalMarks}</td>
                  <td className="p-3">{r.grade || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
