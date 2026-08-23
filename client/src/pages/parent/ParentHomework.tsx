import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { ClipboardCheck } from "lucide-react";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

export default function ParentHomework() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
  }, [user]);

  useEffect(() => {
    const child = children.find((c) => c._id === selectedChildId);
    const classId = child?.classId?._id || child?.classId;
    if (classId) api.get(`/ops/homework?classId=${classId}`).then((res) => setList(res.data));
  }, [selectedChildId, children]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Monitoring</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><ClipboardCheck size={22} className="text-primary" />Homework</h1>
      <div className="mt-6"><ChildSwitcher children={children} /></div>
      <div className="space-y-3">
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
