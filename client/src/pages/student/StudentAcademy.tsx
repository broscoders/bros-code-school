import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";

export default function StudentAcademy() {
  const student = useMyStudentRecord();
  const [programs, setPrograms] = useState<any[]>([]);
  const [batchesByProgram, setBatchesByProgram] = useState<Record<string, any[]>>({});
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [expandedProgram, setExpandedProgram] = useState("");

  const loadEnrollments = async () => {
    if (!student?._id) return;
    const res = await api.get(`/academy/enrollments?studentId=${student._id}`);
    setEnrollments(res.data);
  };

  useEffect(() => {
    if (student?.schoolId) {
      api.get(`/academy/programs?schoolId=${student.schoolId}`).then((res) => setPrograms(res.data));
    }
    loadEnrollments();
  }, [student]);

  const toggleProgram = async (programId: string) => {
    if (expandedProgram === programId) {
      setExpandedProgram("");
      return;
    }
    setExpandedProgram(programId);
    if (!batchesByProgram[programId]) {
      const res = await api.get(`/academy/batches?programId=${programId}`);
      setBatchesByProgram({ ...batchesByProgram, [programId]: res.data });
    }
  };

  const isEnrolled = (batchId: string) => enrollments.some((e) => e.batchId?._id === batchId && e.isActive);

  const enroll = async (batchId: string) => {
    await api.post("/academy/enroll", { schoolId: student.schoolId, studentId: student._id, batchId });
    loadEnrollments();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academy</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Boxes size={22} className="text-primary" />Academy Programs</h1>
      <p className="text-muted mt-1 text-sm">Browse programs and manage your enrollments.</p>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-3">My Enrollments</h2>
        {enrollments.filter((e) => e.isActive).length === 0 ? (
          <p className="text-muted text-sm">You are not enrolled in any academy batch yet.</p>
        ) : (
          <ul className="text-sm divide-y divide-black/5">
            {enrollments.filter((e) => e.isActive).map((e) => (
              <li key={e._id} className="py-2 flex justify-between">
                <span>{e.batchId?.name}</span>
                <span className="text-muted text-xs">{e.batchId?.days?.join(", ")} - {e.batchId?.startTime}-{e.batchId?.endTime}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {programs.length === 0 && <p className="text-muted text-sm">No academy programs available right now.</p>}
        {programs.map((p) => (
          <div key={p._id} className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <button onClick={() => toggleProgram(p._id)} className="w-full text-left p-4 flex justify-between items-center hover:bg-canvas transition-colors">
              <div>
                <p className="font-display font-semibold text-ink">{p.name}</p>
                <p className="text-muted text-xs mt-0.5">{p.description}</p>
              </div>
              <span className="text-primary text-xs underline">{expandedProgram === p._id ? "Hide batches" : "View batches"}</span>
            </button>
            {expandedProgram === p._id && (
              <div className="border-t border-border p-4 space-y-2">
                {(batchesByProgram[p._id] || []).length === 0 && <p className="text-muted text-xs">No batches yet for this program.</p>}
                {(batchesByProgram[p._id] || []).map((b) => (
                  <div key={b._id} className="flex justify-between items-center text-sm border border-border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-ink">{b.name}</p>
                      <p className="text-muted text-xs">{b.days?.join(", ")} - {b.startTime}-{b.endTime}</p>
                    </div>
                    {isEnrolled(b._id) ? (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Enrolled</span>
                    ) : (
                      <button onClick={() => enroll(b._id)} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors">Enroll</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
