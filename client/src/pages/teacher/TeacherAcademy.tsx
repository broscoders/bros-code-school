import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";

export default function TeacherAcademy() {
  const teacher = useMyTeacherRecord();
  const [batches, setBatches] = useState<any[]>([]);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (teacher?._id) {
      api.get(`/academy/batches/mine?teacherId=${teacher._id}`).then((res) => setBatches(res.data));
    }
  }, [teacher]);

  const openBatch = async (batch: any) => {
    setActiveBatch(batch);
    const res = await api.get(`/academy/batches/${batch._id}/students`);
    setEnrollments(res.data);
  };

  if (activeBatch) {
    return (
      <div className="p-8">
        <button onClick={() => setActiveBatch(null)} className="text-primary text-sm underline mb-4">- Back to Batches</button>
        <h1 className="font-display text-xl font-bold text-primary-dark">{activeBatch.name}</h1>
        <p className="text-muted text-sm mt-1">{activeBatch.programId?.name} - {activeBatch.days?.join(", ")} - {activeBatch.startTime}-{activeBatch.endTime}</p>

        <div className="bg-surface rounded-xl border border-border shadow-sm mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 text-primary-dark text-left">
              <tr>
                <th className="p-3 font-medium">Admission #</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Enrolled Since</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-muted">No students enrolled yet.</td></tr>
              ) : (
                enrollments.map((e) => (
                  <tr key={e._id} className="border-t border-border">
                    <td className="p-3">{e.studentId?.admissionNumber}</td>
                    <td className="p-3">{e.studentId?.userId?.name}</td>
                    <td className="p-3 text-muted">{new Date(e.enrollmentDate).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academy</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Boxes size={22} className="text-primary" />My Academy Batches</h1>
      <p className="text-muted mt-1 text-sm">Batches you are assigned to teach.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {batches.length === 0 && <p className="text-muted text-sm">You are not assigned to any academy batch.</p>}
        {batches.map((b) => (
          <button key={b._id} onClick={() => openBatch(b)} className="bg-surface rounded-xl border border-border shadow-sm p-4 text-left hover:border-primary/30 transition-colors">
            <p className="font-display font-semibold text-ink">{b.name}</p>
            <p className="text-muted text-xs mt-1">{b.programId?.name}</p>
            <p className="text-muted text-xs mt-1">{b.days?.join(", ")} - {b.startTime}-{b.endTime}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
