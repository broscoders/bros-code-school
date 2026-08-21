import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";

export default function StudentHomework() {
  const student = useMyStudentRecord();
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    const classId = student?.classId?._id || student?.classId;
    if (classId) api.get(`/ops/homework?classId=${classId}`).then((res) => setList(res.data));
  }, [student]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">My School Life</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Homework</h1>
      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">No homework assigned yet.</p>}
        {list.map((h) => (
          <div key={h._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-primary-dark">{h.title}</h3>
              <span className="text-xs text-muted">Due {new Date(h.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted mt-1">{h.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
