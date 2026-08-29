import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { MessageSquareText } from "lucide-react";

export default function TeacherMessages() {
  const user = useAuthStore((s) => s.user);
  const [inbox, setInbox] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    api.get(`/comm/messages/inbox?userId=${user?.id}`).then((res) => {
      const unique: any[] = [];
      const seen = new Set();
      res.data.forEach((m: any) => {
        if (!seen.has(m.fromUserId?._id)) {
          seen.add(m.fromUserId?._id);
          unique.push(m);
        }
      });
      setInbox(unique);
    });
  }, [user]);

  const openThread = async (fromUser: any) => {
    setSelected(fromUser);
    const res = await api.get(`/comm/messages/thread?userA=${user?.id}&userB=${fromUser._id}`);
    setThread(res.data);
  };

  const reply = async () => {
    if (!text.trim() || !selected) return;
    await api.post("/comm/messages", { schoolId: user?.schoolId, fromUserId: user?.id, toUserId: selected._id, content: text });
    setText("");
    openThread(selected);
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Communication</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><MessageSquareText size={22} className="text-primary" />Parent Messages</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
          <h2 className="font-display font-semibold text-primary-dark mb-3 text-sm">Conversations</h2>
          <ul className="space-y-1">
            {inbox.length === 0 && <li className="text-muted text-sm">No messages yet.</li>}
            {inbox.map((m) => (
              <li key={m._id}>
                <button onClick={() => openThread(m.fromUserId)} className={`w-full text-left px-3 py-2 rounded-md text-sm ${selected?._id === m.fromUserId?._id ? "bg-primary text-white" : "hover:bg-canvas text-ink"}`}>
                  {m.fromUserId?.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 bg-surface rounded-xl border border-border shadow-sm p-4 flex flex-col h-96">
          {!selected ? (
            <p className="text-muted text-sm m-auto">Select a conversation.</p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {thread.map((m) => (
                  <div key={m._id} className={`p-2 rounded-lg max-w-[75%] text-sm ${m.fromUserId === user?.id ? "bg-primary text-white ml-auto" : "bg-canvas text-ink"}`}>
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && reply()} placeholder="Reply..." className="flex-1 border border-border rounded-md px-3 py-2 text-sm" />
                <button onClick={reply} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
