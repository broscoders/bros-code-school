import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Timetable() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [editCell, setEditCell] = useState<{ day: string; period: number } | null>(null);
  const [cellForm, setCellForm] = useState({ startTime: "", endTime: "", subjectId: "", teacherId: "", room: "", isBreak: false });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
    api.get(`/people/teachers?schoolId=${schoolId}`).then((res) => setTeachers(res.data));
  }, [schoolId]);

  useEffect(() => {
    if (classId) {
      api.get(`/academics/sections?classId=${classId}`).then((res) => setSections(res.data));
      api.get(`/academics/subjects?classId=${classId}`).then((res) => setSubjects(res.data));
    } else {
      setSections([]);
      setSubjects([]);
    }
    setSectionId("");
  }, [classId]);

  const loadTimetable = async () => {
    if (!sectionId) return;
    const res = await api.get(`/timetable/class?sectionId=${sectionId}`);
    setSlots(res.data);
  };

  useEffect(() => {
    loadTimetable();
  }, [sectionId]);

  const getSlot = (day: string, period: number) =>
    slots.find((s) => s.dayOfWeek === day && s.periodNumber === period);

  const openCell = (day: string, period: number) => {
    const existing = getSlot(day, period);
    setCellForm({
      startTime: existing?.startTime || "",
      endTime: existing?.endTime || "",
      subjectId: existing?.subjectId?._id || "",
      teacherId: existing?.teacherId?._id || "",
      room: existing?.room || "",
      isBreak: existing?.isBreak || false,
    });
    setError("");
    setEditCell({ day, period });
  };

  const saveCell = async () => {
    if (!editCell) return;
    setError("");
    try {
      await api.post("/timetable/slot", {
        classId,
        sectionId,
        dayOfWeek: editCell.day,
        periodNumber: editCell.period,
        ...cellForm,
      });
      setEditCell(null);
      loadTimetable();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save - check for conflicts.");
    }
  };

  const deleteCell = async () => {
    if (!editCell) return;
    const slot = getSlot(editCell.day, editCell.period);
    if (!slot) { setEditCell(null); return; }
    await api.delete(`/timetable/slot/${slot._id}`);
    setEditCell(null);
    loadTimetable();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academics</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Timetable</h1>
      <p className="text-muted mt-1 text-sm">Build the weekly timetable for each class and section. Clashing teachers or rooms are blocked automatically.</p>

      <div className="flex gap-3 mt-4">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="border border-black/10 rounded-lg px-3 py-2 text-sm">
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="border border-black/10 rounded-lg px-3 py-2 text-sm" disabled={!classId}>
          <option value="">Select Section</option>
          {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {sectionId && (
        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm mt-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-medium text-muted border-b border-black/5">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="p-3 text-left text-xs font-medium text-muted border-b border-black/5">{d.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p} className="border-t border-black/5">
                  <td className="p-3 text-xs font-medium text-muted">Period {p}</td>
                  {DAYS.map((d) => {
                    const slot = getSlot(d, p);
                    return (
                      <td key={d} className="p-2 align-top">
                        <button
                          onClick={() => openCell(d, p)}
                          className={`w-full text-left rounded-lg p-2 text-xs border transition-colors ${
                            slot
                              ? slot.isBreak
                                ? "bg-canvas border-black/10 text-muted"
                                : "bg-primary/5 border-primary/20 text-ink"
                              : "border-dashed border-black/10 text-muted hover:bg-canvas"
                          }`}
                        >
                          {slot ? (
                            slot.isBreak ? (
                              <span>Break</span>
                            ) : (
                              <>
                                <p className="font-medium">{slot.subjectId?.name || "-"}</p>
                                <p className="text-muted">{slot.teacherId?.userId?.name || slot.teacherId?.employeeId || ""}</p>
                                <p className="text-muted">{slot.room}</p>
                              </>
                            )
                          ) : (
                            <span>+ Add</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editCell && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditCell(null)}>
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-ink mb-3">{editCell.day} - Period {editCell.period}</h2>
            {error && <p className="text-danger text-xs mb-2">{error}</p>}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cellForm.isBreak} onChange={(e) => setCellForm({ ...cellForm, isBreak: e.target.checked })} />
                This is a break / free period
              </label>
              <div className="flex gap-2">
                <input placeholder="Start (e.g. 08:00)" value={cellForm.startTime} onChange={(e) => setCellForm({ ...cellForm, startTime: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm w-full" />
                <input placeholder="End (e.g. 08:40)" value={cellForm.endTime} onChange={(e) => setCellForm({ ...cellForm, endTime: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm w-full" />
              </div>
              {!cellForm.isBreak && (
                <>
                  <select value={cellForm.subjectId} onChange={(e) => setCellForm({ ...cellForm, subjectId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Subject</option>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <select value={cellForm.teacherId} onChange={(e) => setCellForm({ ...cellForm, teacherId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => <option key={t._id} value={t._id}>{t.userId?.name}</option>)}
                  </select>
                  <input placeholder="Room" value={cellForm.room} onChange={(e) => setCellForm({ ...cellForm, room: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" />
                </>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveCell} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 hover:bg-primary-dark transition-colors">Save</button>
              {getSlot(editCell.day, editCell.period) && (
                <button onClick={deleteCell} className="border border-danger text-danger px-4 py-2 rounded-lg text-sm font-medium hover:bg-danger/5 transition-colors">Clear</button>
              )}
              <button onClick={() => setEditCell(null)} className="border border-black/10 text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-canvas transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
