import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { IdCard } from "lucide-react";

export default function IDCards() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const [cards, setCards] = useState<Record<string, any>>({});

  useEffect(() => {
    if (schoolId) {
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
      api.get(`/people/teachers?schoolId=${schoolId}`).then((res) => setTeachers(res.data));
    }
  }, [schoolId]);

  const issueCard = async (personType: "STUDENT" | "TEACHER", personId: string) => {
    const res = await api.post("/id-cards/issue", { personType, personId });
    setCards((prev) => ({ ...prev, [personId]: res.data }));
    return res.data;
  };

  const printCard = async (personType: "STUDENT" | "TEACHER", personId: string) => {
    if (!cards[personId]) await issueCard(personType, personId);
    setTimeout(() => {
      const el = document.getElementById(`card-${personId}`);
      if (!el) return;
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<html><head><title>ID Card</title></head><body>${el.outerHTML}</body></html>`);
      win.document.close();
      win.print();
    }, 100);
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Identification</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><IdCard size={22} className="text-primary" />ID Card Generator</h1>
      </div>

      <div className="flex gap-1 mt-6 border-b border-border">
        <button onClick={() => setTab("students")} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "students" ? "border-primary text-ink" : "border-transparent text-muted"}`}>Students</button>
        <button onClick={() => setTab("teachers")} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "teachers" ? "border-primary text-ink" : "border-transparent text-muted"}`}>Teachers</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {tab === "students" && students.map((s) => (
          <div key={s._id}>
            <div id={`card-${s._id}`} className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-4 w-64 shadow-md">
              <p className="text-[10px] uppercase tracking-wider opacity-70">Student ID Card</p>
              <p className="font-display font-bold mt-1">{s.userId?.name}</p>
              <p className="text-xs opacity-80 mt-1">Admission #: {s.admissionNumber}</p>
              <p className="text-xs opacity-80">Class: {s.classId?.name || "-"}</p>
              {cards[s._id] && <p className="text-[10px] opacity-70 mt-2">Card No: {cards[s._id].cardNumber}</p>}
              <div className="mt-3 pt-3 border-t border-white/20 text-[10px] opacity-70">Bros Code School</div>
            </div>
            <div className="flex gap-2 mt-1">
              {!cards[s._id] && <button onClick={() => issueCard("STUDENT", s._id)} className="text-xs text-primary underline">Issue Card</button>}
              <button onClick={() => printCard("STUDENT", s._id)} className="text-xs text-primary underline">Print</button>
            </div>
          </div>
        ))}
        {tab === "teachers" && teachers.map((t) => (
          <div key={t._id}>
            <div id={`card-${t._id}`} className="bg-gradient-to-br from-accent to-amber-600 text-white rounded-xl p-4 w-64 shadow-md">
              <p className="text-[10px] uppercase tracking-wider opacity-70">Staff ID Card</p>
              <p className="font-display font-bold mt-1">{t.userId?.name}</p>
              <p className="text-xs opacity-80 mt-1">Employee ID: {t.employeeId}</p>
              <p className="text-xs opacity-80">{t.qualification || "Teacher"}</p>
              {cards[t._id] && <p className="text-[10px] opacity-70 mt-2">Card No: {cards[t._id].cardNumber}</p>}
              <div className="mt-3 pt-3 border-t border-white/20 text-[10px] opacity-70">Bros Code School</div>
            </div>
            <div className="flex gap-2 mt-1">
              {!cards[t._id] && <button onClick={() => issueCard("TEACHER", t._id)} className="text-xs text-primary underline">Issue Card</button>}
              <button onClick={() => printCard("TEACHER", t._id)} className="text-xs text-primary underline">Print</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

