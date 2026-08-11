import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

export default function ParentResults() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
  }, [user]);

  useEffect(() => {
    if (selectedChildId) api.get(`/ops/results?studentId=${selectedChildId}`).then((res) => setResults(res.data));
  }, [selectedChildId]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Monitoring</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Results</h1>
      <div className="mt-6"><ChildSwitcher children={children} /></div>
      <div className="bg-surface rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Exam</th><th className="p-3 font-medium">Marks</th><th className="p-3 font-medium">Grade</th></tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-muted">No results yet.</td></tr>
            ) : (
              results.map((r) => (
                <tr key={r._id} className="border-t border-black/5">
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
