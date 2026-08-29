import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";
import { Users } from "lucide-react";

export default function ParentPTM() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [slots, setSlots] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const loadSlots = async () => {
    const res = await api.get(`/comm/ptm-slots/available?schoolId=${user?.schoolId}`);
    setSlots(res.data);
  };

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
    loadSlots();
  }, [user]);

  const book = async (slotId: string) => {
    setMsg("");
    try {
      const parentRes = await api.get(`/people/parents?schoolId=${user?.schoolId}`);
      const me = parentRes.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      await api.put(`/comm/ptm-slots/${slotId}/book`, { parentId: me?._id, studentId: selectedChildId });
      loadSlots();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Could not book this slot");
      loadSlots();
    }
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Meetings</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Users size={22} className="text-primary" />
          Parent-Teacher Meeting
        </h1>
        <div className="mt-6"><ChildSwitcher children={children} /></div>
      </div>

      {msg && <p className="text-danger text-sm mt-3">{msg}</p>}

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-4">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-ink-soft text-left">
            <tr><th className="p-3 font-medium">Teacher</th><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Time</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No available slots right now.</td></tr>
            ) : (
              slots.map((s) => (
                <tr key={s._id} className="border-t border-border">
                  <td className="p-3 text-ink">{s.teacherId?.name || "Teacher"}</td>
                  <td className="p-3 text-ink">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="p-3 text-ink">{s.time}</td>
                  <td className="p-3">
                    <button onClick={() => book(s._id)} className="text-primary text-xs underline hover:text-primary-light">Book Slot</button>
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