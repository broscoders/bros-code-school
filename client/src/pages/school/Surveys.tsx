import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { MessageSquareText } from "lucide-react";

export default function Surveys() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [questions, setQuestions] = useState([""]);
  const [responses, setResponses] = useState<any[]>([]);
  const [viewingId, setViewingId] = useState("");

  const load = async () => {
    const res = await api.get(`/store/surveys?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const addQuestion = () => setQuestions([...questions, ""]);
  const updateQuestion = (i: number, val: string) => {
    const copy = [...questions];
    copy[i] = val;
    setQuestions(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/store/surveys", { schoolId, title, targetAudience: audience, questions: questions.filter((q) => q.trim()) });
    setTitle("");
    setQuestions([""]);
    load();
  };

  const viewResponses = async (id: string) => {
    setViewingId(id);
    const res = await api.get(`/store/surveys/${id}/responses`);
    setResponses(res.data);
  };

  return (
    <div className="p-8">
      <p className="section-label">Feedback</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><MessageSquareText size={22} className="text-primary" />Surveys &amp; Feedback</h1>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 space-y-3">
        <input placeholder="Survey Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
        <select value={audience} onChange={(e) => setAudience(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm">
          <option value="ALL">Everyone</option>
          <option value="PARENTS">Parents</option>
          <option value="STUDENTS">Students</option>
          <option value="TEACHERS">Teachers</option>
        </select>
        {questions.map((q, i) => (
          <input key={i} placeholder={`Question ${i + 1}`} value={q} onChange={(e) => updateQuestion(i, e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
        ))}
        <button type="button" onClick={addQuestion} className="text-primary text-xs underline">+ Add another question</button>
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium block hover:bg-primary-light transition-colors">Create Survey</button>
      </form>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
          <h2 className="font-display font-semibold text-primary-dark mb-3 text-sm">Active Surveys</h2>
          <ul className="text-sm divide-y divide-black/5">
            {list.length === 0 && <li className="py-2 text-muted">No surveys yet.</li>}
            {list.map((s) => (
              <li key={s._id} className="py-2 flex justify-between items-center">
                <span>{s.title}</span>
                <button onClick={() => viewResponses(s._id)} className="text-primary text-xs underline">View responses</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
          <h2 className="font-display font-semibold text-primary-dark mb-3 text-sm">Responses</h2>
          {!viewingId ? (
            <p className="text-muted text-sm">Select a survey to view responses.</p>
          ) : responses.length === 0 ? (
            <p className="text-muted text-sm">No responses yet.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {responses.map((r) => (
                <li key={r._id} className="border-b border-border pb-2">
                  <p className="font-medium text-primary-dark">{r.respondedBy?.name}</p>
                  <p className="text-muted text-xs">{r.answers.join(" - ")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
