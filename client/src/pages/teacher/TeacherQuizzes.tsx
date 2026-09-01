import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";

export default function TeacherQuizzes() {
  const teacher = useMyTeacherRecord();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ classId: "", subjectId: "", title: "", description: "", timeLimitMinutes: "20", allowRetake: false, maxAttempts: "" });
  const [questions, setQuestions] = useState([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);
  const [error, setError] = useState("");
  const [viewingResults, setViewingResults] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const load = async () => {
    if (!teacher?._id) return;
    const res = await api.get(`/quizzes/teacher?teacherId=${teacher._id}`);
    setQuizzes(res.data);
  };

  useEffect(() => {
    if (teacher?._id) {
      load();
      api.get(`/academics/classes?schoolId=${teacher.schoolId}`).then((res) => setClasses(res.data));
    }
  }, [teacher]);

  useEffect(() => {
    if (form.classId) {
      api.get(`/academics/subjects?classId=${form.classId}`).then((res) => setSubjects(res.data));
    } else {
      setSubjects([]);
    }
  }, [form.classId]);

  const addQuestion = () => setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);

  const updateQuestion = (i: number, field: string, value: any) => {
    const copy = [...questions];
    (copy[i] as any)[field] = value;
    setQuestions(copy);
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const copy = [...questions];
    copy[qi].options[oi] = value;
    setQuestions(copy);
  };

  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/quizzes", {
        ...form,
        timeLimitMinutes: Number(form.timeLimitMinutes),
        maxAttempts: form.maxAttempts ? Number(form.maxAttempts) : undefined,
        createdBy: teacher._id,
        questions,
      });
      setShowForm(false);
      setForm({ classId: "", subjectId: "", title: "", description: "", timeLimitMinutes: "20", allowRetake: false, maxAttempts: "" });
      setQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create quiz");
    }
  };

  const togglePublish = async (quiz: any) => {
    await api.put(`/quizzes/${quiz._id}/publish`, { isPublished: !quiz.isPublished });
    load();
  };

  const viewResults = async (quiz: any) => {
    setViewingResults(quiz);
    const res = await api.get(`/quizzes/${quiz._id}/results`);
    setResults(res.data);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center border-b border-border pb-5 mb-6">
        <div>
          <p className="section-label">Assessment</p>
          <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Online Quizzes</h1>
          <p className="text-muted mt-1 text-sm">Create MCQ quizzes with auto-marking.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
          {showForm ? "Cancel" : "+ New Quiz"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4 space-y-3">
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Quiz Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
            <input type="number" placeholder="Time Limit (minutes)" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
            <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allowRetake} onChange={(e) => setForm({ ...form, allowRetake: e.target.checked })} />
            Allow students to retake this quiz
          </label>
          <div className="flex items-center gap-2 text-sm mt-2">
            <label className="text-ink-soft">Max attempts (optional, overrides retake toggle):</label>
            <input
              type="number"
              min="1"
              value={form.maxAttempts}
              onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
              placeholder="Unlimited"
              className="border border-border rounded-md px-2 py-1 text-sm w-24"
            />
          </div>

          <div className="space-y-3 mt-3">
            <p className="text-sm font-medium text-ink">Questions</p>
            {questions.map((q, qi) => (
              <div key={qi} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <input placeholder={`Question ${qi + 1}`} value={q.questionText} onChange={(e) => updateQuestion(qi, "questionText", e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm w-full" required />
                  {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qi)} className="text-danger text-xs whitespace-nowrap">Remove</button>}
                </div>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" checked={q.correctOptionIndex === oi} onChange={() => updateQuestion(qi, "correctOptionIndex", oi)} title="Mark as correct answer" />
                    <input placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm w-full" required />
                  </div>
                ))}
              </div>
            ))}
            <button type="button" onClick={addQuestion} className="text-primary text-xs underline">+ Add another question</button>
          </div>

          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">Save Quiz (as draft)</button>
        </form>
      )}

      <div className="bg-surface rounded-xl border border-border shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Questions</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No quizzes yet.</td></tr>
            ) : (
              quizzes.map((q) => (
                <tr key={q._id} className="border-t border-border">
                  <td className="p-3">{q.title}</td>
                  <td className="p-3 text-muted">{q.questions?.length || 0}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.isPublished ? "bg-success/10 text-success" : "bg-canvas text-muted"}`}>
                      {q.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => togglePublish(q)} className="text-primary text-xs underline">{q.isPublished ? "Unpublish" : "Publish"}</button>
                    <button onClick={() => viewResults(q)} className="text-primary text-xs underline">Results</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingResults && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setViewingResults(null)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-ink mb-3">{viewingResults.title} - Results</h2>
            <ul className="text-sm divide-y divide-black/5">
              {results.length === 0 && <li className="py-2 text-muted">No submissions yet.</li>}
              {results.map((r) => (
                <li key={r._id} className="py-2 flex justify-between">
                  <span>{r.studentId?.userId?.name}</span>
                  <span className="text-muted">{r.score}/{r.totalQuestions}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setViewingResults(null)} className="mt-4 text-primary text-sm underline">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
