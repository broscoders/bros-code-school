import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import { Award } from "lucide-react";

export default function TeacherMarks() {
  const teacher = useMyTeacherRecord();
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedExam = exams.find((ex) => ex._id === examId);

  useEffect(() => {
    setExamId("");
    setMarksMap({});
    if (!classId) {
      setExams([]);
      setStudents([]);
      return;
    }
    api.get(`/ops/exams?classId=${classId}`).then((res) => setExams(res.data)).catch(() => setExams([]));
    api.get(`/people/students?classId=${classId}`).then((res) => setStudents(res.data)).catch(() => setStudents([]));
  }, [classId]);

  // show marks that were already entered for this exam
  useEffect(() => {
    setMarksMap({});
    if (!examId) return;
    api
      .get(`/ops/results/by-exam/${examId}`)
      .then((res) => {
        const saved: Record<string, string> = {};
        for (const r of res.data as any[]) saved[r.studentId?._id || r.studentId] = String(r.marksObtained);
        setMarksMap(saved);
      })
      .catch(() => {});
  }, [examId]);

  const saveAll = async () => {
    setMsg(null);
    const entries = students.filter((s) => marksMap[s._id] !== undefined && marksMap[s._id] !== "");
    if (entries.length === 0) return setMsg({ type: "err", text: "Enter marks for at least one student." });
    const total = selectedExam?.totalMarks;
    const bad = entries.find((s) => {
      const n = Number(marksMap[s._id]);
      return Number.isNaN(n) || n < 0 || (total !== undefined && n > total);
    });
    if (bad) return setMsg({ type: "err", text: `Invalid marks for ${bad.userId?.name || "a student"} (must be between 0 and ${total ?? "total marks"}).` });

    setSaving(true);
    const results = await Promise.allSettled(
      entries.map((s) => api.post("/ops/results", { examId, studentId: s._id, marksObtained: Number(marksMap[s._id]) }))
    );
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    setSaving(false);
    if (failed.length === 0) {
      setMsg({ type: "ok", text: `Marks saved for ${entries.length} student(s).` });
    } else {
      const reason = (failed[0].reason as any)?.response?.data?.message || "Server error";
      setMsg({ type: "err", text: `${results.length - failed.length} saved, ${failed.length} failed: ${reason}` });
    }
  };

  return (
    <div className="p-4 sm:p-8">
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

        {msg && <p className={`${msg.type === "ok" ? "text-success" : "text-danger"} text-sm mb-3`}>{msg.text}</p>}

        {examId && students.length > 0 && (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s._id} className="flex justify-between items-center border-b border-border py-2">
                <span className="text-sm">{s.userId?.name} ({s.admissionNumber})</span>
                <input
                  type="number"
                  placeholder="Marks" min={0} max={selectedExam?.totalMarks}
                  value={marksMap[s._id] ?? ""}
                  onChange={(e) => setMarksMap({ ...marksMap, [s._id]: e.target.value })}
                  className="w-24 text-sm border border-border rounded-md px-2 py-1"
                />
              </div>
            ))}
            <button onClick={saveAll} disabled={saving} className="disabled:opacity-60 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium mt-3 hover:bg-primary-light transition-colors">
              {saving ? "Saving..." : "Save Marks"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
