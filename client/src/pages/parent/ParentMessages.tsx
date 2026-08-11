import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";

export default function ParentMessages() {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId;
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [thread, setThread] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (schoolId) api.get(`/people/teachers?schoolId=${schoolId}`).then((res) => setTeachers(res.data));
  }, [schoolId]);

  const loadThread = async (teacherUserId: string) => {
    setSelectedTeacher(teacherUserId);
    const res = await api.get(`/comm/messages/thread?userA=${user?.id}&userB=${teacherUserId}`);
    setThread(res.data);
  };

  const send = async () => {
    if (!text.trim() || !selectedTeacher) return;
    await api.post("/comm/messages", { schoolId, fromUserId: user?.id, toUserId: selectedTeacher, content: text });
    setText("");
    loadThread(selectedTeacher);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Communication</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Message Teachers</h1>
      <p className="text-muted mt-1 text-sm">All communication happens securely within the portal.</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-4">
          <h2 className="font-display font-semibold text-primary-dark mb-3 text-sm">Teachers</h2>
          <ul className="space-y-1">
            {teachers.map((t) => (
              <li key={t._id}>
                <button
                  onClick={() => loadThread(t.userId?._id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedTeacher === t.userId?._id ? "bg-primary text-white" : "hover:bg-canvas text-ink"}`}
                >
                  {t.userId?.name}
                  {t.communicationHours && <p className="text-xs opacity-70 mt-0.5">Responds {t.communicationHours}</p>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 bg-surface rounded-xl border border-black/5 shadow-sm p-4 flex flex-col h-96">
          {!selectedTeacher ? (
            <p className="text-muted text-sm m-auto">Select a teacher to start messaging.</p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {thread.length === 0 && <p className="text-muted text-sm">No messages yet. Say hello!</p>}
                {thread.map((m) => (
                  <div key={m._id} className={`p-2 rounded-lg max-w-[75%] text-sm ${m.fromUserId === user?.id ? "bg-primary text-white ml-auto" : "bg-canvas text-ink"}`}>
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 border border-black/10 rounded-md px-3 py-2 text-sm"
                />
                <button onClick={send} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
