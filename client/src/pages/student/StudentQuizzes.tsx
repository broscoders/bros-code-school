import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";

export default function StudentQuizzes() {
  const student = useMyStudentRecord();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const answersRef = useRef<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<{ score: number; totalQuestions: number } | null>(null);
  const timerRef = useRef<any>(null);

  const load = async () => {
    const classId = student?.classId?._id || student?.classId;
    if (!classId) return;
    const res = await api.get(`/quizzes/class?classId=${classId}&studentId=${student._id}`);
    setQuizzes(res.data);
  };

  useEffect(() => {
    if (student) load();
  }, [student]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startQuiz = async (quiz: any) => {
    const res = await api.post("/quizzes/attempt/start", { quizId: quiz._id, studentId: student._id });
    setActiveQuiz({ ...res.data, quizId: quiz._id });
    const initialAnswers = res.data.existingAnswers?.length ? res.data.existingAnswers : new Array(res.data.questions.length).fill(-1);
    setAnswers(initialAnswers);
    answersRef.current = initialAnswers;
    setResult(null);

    const totalSeconds = res.data.timeLimitMinutes * 60;
    setSecondsLeft(totalSeconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          doSubmit(res.data.attemptId, answersRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const selectAnswer = (qIndex: number, optionIndex: number) => {
    const copy = [...answers];
    copy[qIndex] = optionIndex;
    setAnswers(copy);
    answersRef.current = copy;
  };

  const doSubmit = async (attemptId: string, finalAnswers: number[]) => {
    clearInterval(timerRef.current);
    const res = await api.post("/quizzes/attempt/submit", { attemptId, answers: finalAnswers });
    setResult(res.data);
    setActiveQuiz(null);
    load();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (activeQuiz) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="flex justify-between items-center sticky top-0 bg-canvas py-2 z-10">
          <h1 className="font-display text-xl font-bold text-primary-dark">{activeQuiz.quizTitle}</h1>
          <span className="bg-danger/10 text-danger px-3 py-1 rounded-full text-sm font-semibold">{formatTime(secondsLeft)}</span>
        </div>

        <div className="space-y-4 mt-4">
          {activeQuiz.questions.map((q: any, qi: number) => (
            <div key={qi} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <p className="text-sm font-medium text-ink mb-3">{qi + 1}. {q.questionText}</p>
              <div className="space-y-2">
                {q.options.map((opt: string, oi: number) => (
                  <label key={oi} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi} onChange={() => selectAnswer(qi, oi)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => doSubmit(activeQuiz.attemptId, answers)} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium mt-4 hover:bg-primary-dark transition-colors">
          Submit Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Assessment</p>
        <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Online Quizzes</h1>
        <p className="text-muted mt-1 text-sm">Timed quizzes assigned to your class.</p>
      </div>

      {result && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 mt-4 text-success text-sm font-medium">
          Quiz submitted! You scored {result.score}/{result.totalQuestions}.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {quizzes.length === 0 && <p className="text-muted text-sm">No quizzes available right now.</p>}
        {quizzes.map((q) => (
          <div key={q._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <p className="font-display font-semibold text-ink">{q.title}</p>
            <p className="text-muted text-xs mt-1">{q.subjectId?.name} - {q.questionCount} questions - {q.timeLimitMinutes} min</p>
            {q.myAttemptStatus === "SUBMITTED" && (
              <p className="text-success text-sm mt-3 font-medium">
                Best score: {q.myScore}/{q.questionCount}
                {q.maxAttempts > 0 && <span className="text-muted font-normal"> · {q.myAttemptsUsed}/{q.maxAttempts} attempts used</span>}
              </p>
            )}
            {(q.myAttemptStatus !== "SUBMITTED" || q.maxAttempts === 0 || q.myAttemptsUsed < q.maxAttempts) && (
              <button onClick={() => startQuiz(q)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium mt-3 hover:bg-primary-dark transition-colors">
                {q.myAttemptStatus === "IN_PROGRESS" ? "Resume Quiz" : q.myAttemptStatus === "SUBMITTED" ? "Retake Quiz" : "Start Quiz"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
