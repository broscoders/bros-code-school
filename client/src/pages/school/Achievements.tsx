import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Trophy } from "lucide-react";

const CATEGORY_STYLES: Record<string, string> = {
  ACADEMIC: "bg-accent-soft text-accent",
  SPORTS: "bg-success/10 text-success",
  COMPETITION: "bg-warning/10 text-warning",
  APPRECIATION: "bg-primary/10 text-primary",
  PARTICIPATION: "bg-canvas text-muted",
};

export default function Achievements() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", category: "ACADEMIC", description: "" });

  useEffect(() => {
    if (schoolId) api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
  }, [schoolId]);

  const loadAchievements = async (studentId: string) => {
    if (!studentId) return setList([]);
    const res = await api.get(`/achievements?studentId=${studentId}`);
    setList(res.data);
  };

  useEffect(() => {
    loadAchievements(selectedStudent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    await api.post("/achievements", { ...form, studentId: selectedStudent, schoolId });
    setForm({ title: "", category: "ACADEMIC", description: "" });
    loadAchievements(selectedStudent);
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Student Life</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Trophy size={22} className="text-primary" />Achievements
        </h1>
        <p className="text-muted mt-1 text-sm">Record academic, sports, and extracurricular achievements for a student's long-term profile.</p>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-medium text-muted mb-1.5">Select student</label>
        <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm w-full max-w-sm">
          <option value="">Choose a student...</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
        </select>
      </div>

      {selectedStudent && (
        <>
          <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mb-6 grid grid-cols-2 gap-3">
            <input placeholder="Title (e.g. Science Fair Winner)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm col-span-2" required />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm">
              <option value="ACADEMIC">Academic</option>
              <option value="SPORTS">Sports</option>
              <option value="COMPETITION">Competition</option>
              <option value="APPRECIATION">Appreciation</option>
              <option value="PARTICIPATION">Participation</option>
            </select>
            <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">+ Add Achievement</button>
          </form>

          <div className="space-y-3">
            {list.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border p-8 text-center text-muted text-sm">No achievements recorded yet.</div>
            ) : (
              list.map((a) => (
                <div key={a._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-ink text-sm">{a.title}</h3>
                    <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[a.category]}`}>{a.category}</span>
                  </div>
                  {a.description && <p className="text-sm text-muted mt-1">{a.description}</p>}
                  <p className="text-[11px] text-muted mt-2">{new Date(a.dateAwarded).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
