import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Exams() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [examForm, setExamForm] = useState({ classId: "", sectionId: "", subjectId: "", name: "", examType: "TEST", date: "", totalMarks: "" });
  const [resultForm, setResultForm] = useState({ examId: "", studentId: "", marksObtained: "", grade: "" });

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

  const createExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/exams", { ...examForm, schoolId });
    setExamForm({ ...examForm, name: "", date: "", totalMarks: "" });
    const res = await api.get(`/ops/exams?classId=${examForm.classId}`);
    setExams(res.data);
  };

  const enterResult = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/results", resultForm);
    setResultForm({ ...resultForm, studentId: "", marksObtained: "", grade: "" });
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academics</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Exams & Results</h1>
      <p className="text-muted mt-1 text-sm">Schedule exams and record student results.</p>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Schedule Exam</h2>
          <form onSubmit={createExam} className="space-y-2">
            <select value={examForm.classId} onChange={(e) => setExamForm({ ...examForm, classId: e.target.value, sectionId: "", subjectId: "" })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select value={examForm.sectionId} onChange={(e) => setExamForm({ ...examForm, sectionId: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required disabled={!examForm.classId}>
              <option value="">Select Section</option>
              {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select value={examForm.subjectId} onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required disabled={!examForm.classId}>
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input placeholder="Exam Name (e.g. Midterm)" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <select value={examForm.examType} onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm">
              <option value="QUIZ">Quiz</option>
              <option value="TEST">Test</option>
              <option value="MIDTERM">Midterm</option>
              <option value="FINAL">Final</option>
              <option value="PRACTICAL">Practical</option>
            </select>
            <input type="date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <input type="number" placeholder="Total Marks" value={examForm.totalMarks} onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Schedule Exam</button>
          </form>
          <ul className="text-sm divide-y divide-black/5 mt-4">
            {exams.map((ex) => (
              <li key={ex._id} className="py-2 flex justify-between">
                <span>{ex.name} ({ex.examType})</span>
                <span className="text-muted text-xs">{new Date(ex.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Enter Result</h2>
          <form onSubmit={enterResult} className="space-y-2">
            <select value={resultForm.examId} onChange={(e) => setResultForm({ ...resultForm, examId: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Exam</option>
              {exams.map((ex) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
            </select>
            <select value={resultForm.studentId} onChange={(e) => setResultForm({ ...resultForm, studentId: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
            </select>
            <input type="number" placeholder="Marks Obtained" value={resultForm.marksObtained} onChange={(e) => setResultForm({ ...resultForm, marksObtained: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Grade (e.g. A)" value={resultForm.grade} onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">Save Result</button>
          </form>
        </div>
      </div>
    </div>
  );
}
