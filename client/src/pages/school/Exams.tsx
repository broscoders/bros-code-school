import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Award, CheckCircle2 } from "lucide-react";

export default function Exams() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [examForm, setExamForm] = useState({ classId: "", sectionId: "", subjectId: "", name: "", examType: "TEST", date: "", totalMarks: "" });
  const [resultForm, setResultForm] = useState({ examId: "", studentId: "", marksObtained: "", grade: "" });
  const [err, setErr] = useState("");
  const [publishMsg, setPublishMsg] = useState("");

  useEffect(() => {
    if (schoolId) api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
  }, [schoolId]);

  useEffect(() => {
    if (examForm.classId) {
      api.get(`/academics/sections?classId=${examForm.classId}`).then((res) => setSections(res.data));
      api.get(`/academics/subjects?classId=${examForm.classId}`).then((res) => setSubjects(res.data));
      api.get(`/ops/exams?classId=${examForm.classId}`).then((res) => setExams(res.data));
      api.get(`/people/students?schoolId=${schoolId}`).then((res) =>
        setStudents(res.data.filter((s: any) => s.classId === examForm.classId || s.classId?._id === examForm.classId))
      );
    }
  }, [examForm.classId]);

  useEffect(() => {
    if (resultForm.examId) {
      loadResultsForExam(resultForm.examId);
    } else {
      setResults([]);
    }
  }, [resultForm.examId]);

  const loadResultsForExam = async (examId: string) => {
    const res = await api.get(`/ops/results/by-exam/${examId}`).catch(() => ({ data: [] }));
    setResults(res.data || []);
  };

  const selectedExam = exams.find((ex) => ex._id === resultForm.examId);

  const createExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/exams", { ...examForm, schoolId });
    setExamForm({ ...examForm, name: "", date: "", totalMarks: "" });
    const res = await api.get(`/ops/exams?classId=${examForm.classId}`);
    setExams(res.data);
  };

  const enterResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (selectedExam && Number(resultForm.marksObtained) > selectedExam.totalMarks) {
      setErr(`Marks cannot exceed total marks (${selectedExam.totalMarks})`);
      return;
    }
    try {
      await api.post("/ops/results", resultForm);
      setResultForm({ ...resultForm, studentId: "", marksObtained: "", grade: "" });
      loadResultsForExam(resultForm.examId);
    } catch (error: any) {
      setErr(error.response?.data?.message || "Failed to save result");
    }
  };

  const publishResults = async () => {
    if (!resultForm.examId) return;
    if (results.length < students.length) {
      const proceed = confirm(`Only ${results.length} of ${students.length} students have results entered. Publish anyway?`);
      if (!proceed) return;
    }
    await api.put(`/ops/results/${resultForm.examId}/publish`, {});
    setPublishMsg("Results published. Students and parents can now see them.");
    setTimeout(() => setPublishMsg(""), 4000);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academics</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
        <Award size={22} className="text-primary" />
        Exams &amp; Results
      </h1>
      <p className="text-muted mt-1 text-sm">Schedule exams and record student results.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Schedule Exam</h2>
          <form onSubmit={createExam} className="space-y-2">
            <select value={examForm.classId} onChange={(e) => setExamForm({ ...examForm, classId: e.target.value, sectionId: "", subjectId: "" })} className="w-full" required>
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select value={examForm.sectionId} onChange={(e) => setExamForm({ ...examForm, sectionId: e.target.value })} className="w-full" required disabled={!examForm.classId}>
              <option value="">Select Section</option>
              {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select value={examForm.subjectId} onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })} className="w-full" required disabled={!examForm.classId}>
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input placeholder="Exam Name (e.g. Midterm)" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} className="w-full" required />
            <select value={examForm.examType} onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })} className="w-full">
              <option value="QUIZ">Quiz</option>
              <option value="TEST">Test</option>
              <option value="MIDTERM">Midterm</option>
              <option value="FINAL">Final</option>
              <option value="PRACTICAL">Practical</option>
            </select>
            <input type="date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} className="w-full" required />
            <input type="number" placeholder="Total Marks" value={examForm.totalMarks} onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })} className="w-full" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">
              + Schedule Exam
            </button>
          </form>
          <ul className="text-sm divide-y divide-border mt-4">
            {exams.map((ex) => (
              <li key={ex._id} className="py-2 flex justify-between">
                <span className="text-ink">{ex.name} <span className="text-muted">({ex.examType})</span></span>
                <span className="text-muted text-xs">{new Date(ex.date).toLocaleDateString()} &middot; /{ex.totalMarks}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Enter Result</h2>
          <form onSubmit={enterResult} className="space-y-2">
            {err && <p className="text-danger text-xs">{err}</p>}
            <select value={resultForm.examId} onChange={(e) => setResultForm({ ...resultForm, examId: e.target.value })} className="w-full" required>
              <option value="">Select Exam</option>
              {exams.map((ex) => <option key={ex._id} value={ex._id}>{ex.name} (/{ex.totalMarks})</option>)}
            </select>
            <select value={resultForm.studentId} onChange={(e) => setResultForm({ ...resultForm, studentId: e.target.value })} className="w-full" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
            </select>
            <input
              type="number"
              placeholder={selectedExam ? `Marks Obtained (out of ${selectedExam.totalMarks})` : "Marks Obtained"}
              value={resultForm.marksObtained}
              onChange={(e) => setResultForm({ ...resultForm, marksObtained: e.target.value })}
              max={selectedExam?.totalMarks}
              min={0}
              className="w-full"
              required
            />
            <input placeholder="Grade (e.g. A)" value={resultForm.grade} onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })} className="w-full" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">
              Save Result
            </button>
          </form>

          {resultForm.examId && (
            <>
              <div className="flex items-center justify-between mt-4 mb-2">
                <p className="text-xs text-muted">
                  <CheckCircle2 size={12} className="inline mr-1 text-success" />
                  {results.length} of {students.length} students graded
                </p>
              </div>
              <ul className="text-sm divide-y divide-border max-h-40 overflow-y-auto">
                {results.map((r: any) => (
                  <li key={r._id} className="py-1.5 flex justify-between">
                    <span className="text-ink">{r.studentId?.userId?.name || r.studentId}</span>
                    <span className="text-muted">{r.marksObtained}/{selectedExam?.totalMarks}</span>
                  </li>
                ))}
              </ul>

              {publishMsg && <p className="text-success text-xs mt-3">{publishMsg}</p>}
              <button onClick={publishResults} className="border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium w-full mt-3 hover:bg-primary/10 transition-colors">
                Publish Results for This Exam
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}