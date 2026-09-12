import { useEffect, useState } from "react";
import api from "../../services/api";
import { MonitorCheck, CheckCircle2, Circle, Users, Percent } from "lucide-react";

export default function OnlineExamsOverview() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/quizzes/school")
      .then((res) => setQuizzes(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Academics</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <MonitorCheck size={22} className="text-primary" />Online Exams
        </h1>
        <p className="text-muted mt-1 text-sm">Quizzes and online tests created by teachers across the school.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : quizzes.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-10 text-center text-muted text-sm">
          No quizzes have been created yet.
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-ink text-left">
              <tr>
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Class / Subject</th>
                <th className="p-3 font-medium">Teacher</th>
                <th className="p-3 font-medium">Questions</th>
                <th className="p-3 font-medium">Attempts</th>
                <th className="p-3 font-medium">Avg. Score</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q._id} className="border-t border-border">
                  <td className="p-3 font-medium text-ink">{q.title}</td>
                  <td className="p-3 text-muted">{q.classId?.name || "-"} / {q.subjectId?.name || "-"}</td>
                  <td className="p-3 text-muted">{q.createdBy?.userId?.name || "Unknown"}</td>
                  <td className="p-3 text-muted">{q.questionCount}</td>
                  <td className="p-3 text-muted flex items-center gap-1"><Users size={12} />{q.attemptCount}</td>
                  <td className="p-3 text-muted">
                    {q.averageScore != null ? (
                      <span className="flex items-center gap-1"><Percent size={12} />{Math.round(q.averageScore)}</span>
                    ) : "-"}
                  </td>
                  <td className="p-3">
                    {q.isPublished ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full w-fit">
                        <CheckCircle2 size={12} />Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-muted bg-canvas px-2 py-0.5 rounded-full w-fit">
                        <Circle size={12} />Draft
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
