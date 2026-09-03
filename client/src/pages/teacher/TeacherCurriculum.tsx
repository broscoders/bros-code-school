import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import { BookMarked, Plus, Trash2 } from "lucide-react";

type Topic = {
  _id: string;
  chapterName: string;
  topicName: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  teacherNotes?: string;
};

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-white/5 text-muted",
  IN_PROGRESS: "bg-accent-soft text-accent",
  COMPLETED: "bg-success-soft text-success",
};

export default function TeacherCurriculum() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const teacher = useMyTeacherRecord();
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState({ chapterName: "", topicName: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (schoolId) {
      api.get(`/academics/sessions?schoolId=${schoolId}`).then((res) => {
        const active = res.data.find((s: any) => s.isActive) || res.data[0];
        if (active) setSessionId(active._id);
      });
    }
  }, [schoolId]);

  const load = async () => {
    if (!classId || !subjectId) return;
    const res = await api.get(`/curriculum/topics?classId=${classId}&subjectId=${subjectId}&academicSessionId=${sessionId}`);
    setTopics(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subjectId, sessionId]);

  const addTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !subjectId) {
      setMsg("Select a class and subject first.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    await api.post("/curriculum/topics", { ...form, classId, subjectId, academicSessionId: sessionId, order: topics.length });
    setForm({ chapterName: "", topicName: "" });
    load();
  };

  const setStatus = async (topicId: string, status: string) => {
    await api.put(`/curriculum/topics/${topicId}/status`, { status });
    load();
  };

  const removeTopic = async (topicId: string) => {
    await api.delete(`/curriculum/topics/${topicId}`);
    load();
  };

  const completedCount = topics.filter((t) => t.status === "COMPLETED").length;
  const pct = topics.length ? Math.round((completedCount / topics.length) * 100) : 0;

  const groupedByChapter = topics.reduce((acc: Record<string, Topic[]>, t) => {
    (acc[t.chapterName] = acc[t.chapterName] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Teaching</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <BookMarked size={22} className="text-primary" />
          Curriculum Tracker
        </h1>
        <p className="text-muted mt-1 text-sm">Track syllabus progress chapter by chapter, topic by topic.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted mb-1">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm">
            <option value="">Select Class</option>
            {teacher?.assignedClasses?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm">
            <option value="">Select Subject</option>
            {teacher?.subjects?.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        {topics.length > 0 && (
          <div className="ml-auto min-w-[160px]">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{completedCount}/{topics.length} topics</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {classId && subjectId && (
        <form onSubmit={addTopic} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4 flex flex-wrap gap-2 items-end">
          {msg && <p className="text-danger text-xs w-full">{msg}</p>}
          <input
            placeholder="Chapter (e.g. Chapter 3: Fractions)"
            value={form.chapterName}
            onChange={(e) => setForm({ ...form, chapterName: e.target.value })}
            className="border border-border rounded-md px-3 py-2 text-sm flex-1 min-w-[200px]"
            required
          />
          <input
            placeholder="Topic (e.g. Adding fractions)"
            value={form.topicName}
            onChange={(e) => setForm({ ...form, topicName: e.target.value })}
            className="border border-border rounded-md px-3 py-2 text-sm flex-1 min-w-[200px]"
            required
          />
          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors flex items-center gap-1.5">
            <Plus size={15} /> Add Topic
          </button>
        </form>
      )}

      <div className="mt-4 space-y-4">
        {classId && subjectId && topics.length === 0 && (
          <p className="text-muted text-sm">No topics added yet for this class and subject.</p>
        )}
        {Object.entries(groupedByChapter).map(([chapter, chapterTopics]) => (
          <div key={chapter} className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-canvas font-medium text-sm text-ink">{chapter}</div>
            <ul className="divide-y divide-border">
              {chapterTopics.map((t) => (
                <li key={t._id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-ink-soft flex-1">{t.topicName}</span>
                  <select
                    value={t.status}
                    onChange={(e) => setStatus(t._id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 ${STATUS_STYLES[t.status]}`}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <button onClick={() => removeTopic(t._id)} className="text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
