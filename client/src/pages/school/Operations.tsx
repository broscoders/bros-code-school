import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { MessageSquareWarning } from "lucide-react";

// Was a 4-tab page: Library, Transport, Complaints, Calendar/Events. The
// Library and Transport tabs duplicated the dedicated Library.tsx and
// Transport.tsx pages (which are more complete - e.g. this page could add
// a book but not issue one, add a vehicle but not assign a student to it),
// so they're removed here; use the Library / Transport pages for those.
// Complaints and Events have no other page, so they stay.
export default function Operations() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<"complaints" | "events">("complaints");

  const [complaints, setComplaints] = useState<any[]>([]);
  const [complaintForm, setComplaintForm] = useState({ category: "GENERAL", subject: "", description: "" });

  const [events, setEvents] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ title: "", eventType: "HOLIDAY", date: "" });

  const loadAll = async () => {
    const [c, e] = await Promise.all([
      api.get(`/complaints?schoolId=${schoolId}`),
      api.get(`/events?schoolId=${schoolId}`),
    ]);
    setComplaints(c.data);
    setEvents(e.data);
  };

  useEffect(() => {
    if (schoolId) loadAll();
  }, [schoolId]);

  const addComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/complaints", { ...complaintForm, schoolId, raisedBy: userId });
    setComplaintForm({ category: "GENERAL", subject: "", description: "" });
    loadAll();
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/events", { ...eventForm, schoolId });
    setEventForm({ title: "", eventType: "HOLIDAY", date: "" });
    loadAll();
  };

  const tabs = [
    { id: "complaints", label: "Complaints" },
    { id: "events", label: "Events" },
  ] as const;

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Safety & Facilities</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><MessageSquareWarning size={22} className="text-primary" />Complaints & Events</h1>
        <p className="text-muted mt-1 text-sm">Raise or track complaint tickets, and add calendar events.</p>
      </div>

      <div className="flex gap-1 mt-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-accent text-primary-dark" : "border-transparent text-muted hover:text-primary-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "complaints" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <form onSubmit={addComplaint} className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-2 h-fit">
            <h2 className="font-display font-semibold text-primary-dark mb-1">Raise Complaint</h2>
            <select value={complaintForm.category} onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm">
              <option value="ACADEMIC">Academic</option>
              <option value="FEE">Fee</option>
              <option value="TRANSPORT">Transport</option>
              <option value="TEACHER">Teacher</option>
              <option value="GENERAL">General</option>
              <option value="TECHNICAL">Technical</option>
            </select>
            <input placeholder="Subject" value={complaintForm.subject} onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <textarea placeholder="Description" value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" rows={3} required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Submit Ticket</button>
          </form>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <h2 className="font-display font-semibold text-primary-dark mb-3">Tickets</h2>
            <ul className="text-sm divide-y divide-black/5">
              {complaints.length === 0 && <li className="py-2 text-muted">No tickets yet.</li>}
              {complaints.map((c) => (
                <li key={c._id} className="py-2 flex justify-between">
                  <span>#{c.ticketNumber} - {c.subject}</span>
                  <span className="text-muted text-xs">{c.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <form onSubmit={addEvent} className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-2 h-fit">
            <h2 className="font-display font-semibold text-primary-dark mb-1">Add Event</h2>
            <input placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <select value={eventForm.eventType} onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm">
              <option value="HOLIDAY">Holiday</option>
              <option value="EXAM">Exam</option>
              <option value="PTM">PTM</option>
              <option value="SPORTS">Sports</option>
              <option value="TRIP">Trip</option>
              <option value="FUNCTION">Function</option>
            </select>
            <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Event</button>
          </form>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <h2 className="font-display font-semibold text-primary-dark mb-3">Upcoming Events</h2>
            <ul className="text-sm divide-y divide-black/5">
              {events.length === 0 && <li className="py-2 text-muted">No events yet.</li>}
              {events.map((e) => (
                <li key={e._id} className="py-2 flex justify-between">
                  <span>{e.title}</span>
                  <span className="text-muted text-xs">{new Date(e.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
