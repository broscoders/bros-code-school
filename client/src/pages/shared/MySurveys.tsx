import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import api from "../../services/api";

type Survey = { _id: string; title: string; description?: string; questions: string[] };

// One page for parents, students and teachers to answer the surveys that the
// school created for them. The Surveys screen for staff existed, but nothing
// let a respondent actually fill one in, so no survey ever got a response.
export default function MySurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/store/surveys")
      .then((res) => setSurveys(res.data))
      .catch(() => setError("Could not load surveys."))
      .finally(() => setLoading(false));
  }, []);

  const setAnswer = (surveyId: string, index: number, value: string, total: number) => {
    setAnswers((prev) => {
      const current = prev[surveyId] ? [...prev[surveyId]] : Array(total).fill("");
      current[index] = value;
      return { ...prev, [surveyId]: current };
    });
  };

  const submit = async (survey: Survey) => {
    setError("");
    const list = answers[survey._id] || Array(survey.questions.length).fill("");
    if (list.every((a) => !a.trim())) return setError("Please answer at least one question.");
    try {
      await api.post("/store/surveys/respond", { surveyId: survey._id, answers: list });
      setDone((prev) => new Set(prev).add(survey._id));
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Could not submit your answers.";
      setError(msg);
      // already answered earlier -> show it as done instead of leaving the form open
      if (err?.response?.status === 409) setDone((prev) => new Set(prev).add(survey._id));
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">School</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <MessageSquareText size={22} className="text-primary" />Surveys
        </h1>
        <p className="text-muted mt-1 text-sm">Share your feedback with the school.</p>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      {loading && <p className="text-muted text-sm">Loading...</p>}
      {!loading && surveys.length === 0 && <p className="text-muted text-sm">There are no surveys for you right now.</p>}

      <div className="space-y-4">
        {surveys.map((s) => (
          <div key={s._id} className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <h2 className="font-display font-semibold text-primary-dark">{s.title}</h2>
            {s.description && <p className="text-sm text-muted mt-1">{s.description}</p>}
            {done.has(s._id) ? (
              <p className="text-success text-sm mt-3">Thank you - your answers have been recorded.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {s.questions.map((q, i) => (
                  <div key={i}>
                    <label className="block text-sm text-ink mb-1">{i + 1}. {q}</label>
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={answers[s._id]?.[i] || ""}
                      onChange={(e) => setAnswer(s._id, i, e.target.value, s.questions.length)}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <button onClick={() => submit(s)} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
                  Submit answers
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
