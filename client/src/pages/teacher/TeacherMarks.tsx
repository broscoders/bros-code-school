import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import { useAuthStore } from "../../store/authStore";
import { Award } from "lucide-react";

export default function TeacherMarks() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const teacher = useMyTeacherRecord();
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (classId) {
      api.get(`/ops/exams?classId=${classId}`).then((res) => setExams(res.data));
      api.get(`/people/students?schoolId=${schoolId}`).then((res) =>
        setStudents(res.data.filter((s: any) => s.classId === classId || s.classId?._id === classId))
      );
    }
  }, [classId]);

  const saveAll = async () => {
    await Promise.all(
      students.map((s) =>
        marksMap[s._id]
          ? api.post("/ops/results", { examId, studentId: s._id, marksObtained: marksMap[s._id] })
          : Promise.resolve()
      )
    );
    setMsg("Marks saved.");
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Teaching</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Award size={22} className="text-primary" />Marks Entry</h1>
        <p className="text-muted mt-1 text-sm">Enter exam marks for your students.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm">
            <option value="">Select Class</option>
            {teacher?.assignedClasses?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm" disabled={!classId}>
            <option value="">Select Exam</option>
            {exams.map((ex) => <option key={ex._id} value={ex._id}>{ex.name} (out of {ex.totalMarks})</option>)}
          </select>
        </div>

        {msg && <p className="text-success text-sm mb-3">{msg}</p>}

        {examId && students.length > 0 && (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s._id} className="flex justify-between items-center border-b border-border py-2">
                <span className="text-sm">{s.userId?.name} ({s.admissionNumber})</span>
                <input
                  type="number"
                  placeholder="Marks"
                  value={marksMap[s._id] || ""}
                  onChange={(e) => setMarksMap({ ...marksMap, [s._id]: e.target.value })}
                  className="w-24 text-sm border border-border rounded-md px-2 py-1"
                />
              </div>
            ))}
            <button onClick={saveAll} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium mt-3 hover:bg-primary-light transition-colors">
              Save Marks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
