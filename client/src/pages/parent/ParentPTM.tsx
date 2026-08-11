import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

export default function ParentPTM() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
    api.get(`/comm/ptm-slots/available?schoolId=${user?.schoolId}`).then((res) => setSlots(res.data));
  }, [user]);

  const book = async (slotId: string) => {
    const parentRes = await api.get(`/people/parents?schoolId=${user?.schoolId}`);
    const me = parentRes.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
    await api.put(`/comm/ptm-slots/${slotId}/book`, { parentId: me?._id, studentId: selectedChildId });
    const res = await api.get(`/comm/ptm-slots/available?schoolId=${user?.schoolId}`);
    setSlots(res.data);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Meetings</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Parent-Teacher Meeting</h1>
      <div className="mt-6"><ChildSwitcher children={children} /></div>

      <div className="bg-surface rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Teacher</th><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Time</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No available slots right now.</td></tr>
            ) : (
              slots.map((s) => (
                <tr key={s._id} className="border-t border-black/5">
                  <td className="p-3">{s.teacherId?.name || "Teacher"}</td>
                  <td className="p-3">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="p-3">{s.time}</td>
                  <td className="p-3">
                    <button onClick={() => book(s._id)} className="text-primary text-xs underline">Book Slot</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
