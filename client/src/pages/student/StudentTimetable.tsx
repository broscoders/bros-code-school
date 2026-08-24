import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";
import { Calendar } from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function StudentTimetable() {
  const student = useMyStudentRecord();
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    const sectionId = student?.sectionId?._id || student?.sectionId;
    if (sectionId) {
      api.get(`/timetable/class?sectionId=${sectionId}`).then((res) => setSlots(res.data));
    }
  }, [student]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academics</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Calendar size={22} className="text-primary" />My Timetable</h1>
      <p className="text-muted mt-1 text-sm">Your weekly class schedule.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day).sort((a, b) => a.periodNumber - b.periodNumber);
          return (
            <div key={day} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <h2 className="font-display font-semibold text-primary-dark mb-3 text-sm">{day}</h2>
              <ul className="text-sm divide-y divide-black/5">
                {daySlots.length === 0 && <li className="py-2 text-muted">No periods scheduled.</li>}
                {daySlots.map((s) => (
                  <li key={s._id} className="py-2 flex justify-between">
                    <span>{s.isBreak ? "Break" : s.subjectId?.name}</span>
                    <span className="text-muted text-xs">{s.startTime}-{s.endTime}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}