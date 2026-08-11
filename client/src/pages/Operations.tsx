import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Operations() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<"library" | "transport" | "complaints" | "events">("library");

  const [books, setBooks] = useState<any[]>([]);
  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "", totalCopies: "1" });

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: "", driverName: "", driverContact: "", routeName: "" });

  const [complaints, setComplaints] = useState<any[]>([]);
  const [complaintForm, setComplaintForm] = useState({ category: "GENERAL", subject: "", description: "" });

  const [events, setEvents] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ title: "", eventType: "HOLIDAY", date: "" });

  const loadAll = async () => {
    const [b, v, c, e] = await Promise.all([
      api.get(`/misc/library/books?schoolId=${schoolId}`),
      api.get(`/misc/transport/vehicles?schoolId=${schoolId}`),
      api.get(`/misc/complaints?schoolId=${schoolId}`),
      api.get(`/misc/events?schoolId=${schoolId}`),
    ]);
    setBooks(b.data);
    setVehicles(v.data);
    setComplaints(c.data);
    setEvents(e.data);
  };

  useEffect(() => {
    if (schoolId) loadAll();
  }, [schoolId]);

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/misc/library/books", { ...bookForm, schoolId, availableCopies: bookForm.totalCopies });
    setBookForm({ title: "", author: "", category: "", totalCopies: "1" });
    loadAll();
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/misc/transport/vehicles", { ...vehicleForm, schoolId });
    setVehicleForm({ vehicleNumber: "", driverName: "", driverContact: "", routeName: "" });
    loadAll();
  };

  const addComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/misc/complaints", { ...complaintForm, schoolId, raisedBy: userId });
    setComplaintForm({ category: "GENERAL", subject: "", description: "" });
    loadAll();
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/misc/events", { ...eventForm, schoolId });
    setEventForm({ title: "", eventType: "HOLIDAY", date: "" });
    loadAll();
  };

  const tabs = [
    { id: "library", label: "Library" },
    { id: "transport", label: "Transport" },
    { id: "complaints", label: "Complaints" },
    { id: "events", label: "Calendar" },
  ] as const;

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Operations</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">School Operations</h1>
      <p className="text-muted mt-1 text-sm">Library, transport, complaints and calendar in one place.</p>

      <div className="flex gap-1 mt-6 border-b border-black/10">
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

      {tab === "library" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addBook} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <h2 className="font-display font-semibold text-primary-dark mb-1">Add Book</h2>
            <input placeholder="Title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" />
            <input placeholder="Category" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" />
            <input type="number" placeholder="Total Copies" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Book</button>
          </form>
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
            <h2 className="font-display font-semibold text-primary-dark mb-3">Books</h2>
            <ul className="text-sm divide-y divide-black/5">
              {books.length === 0 && <li className="py-2 text-muted">No books yet.</li>}
              {books.map((b) => (
                <li key={b._id} className="py-2 flex justify-between">
                  <span>{b.title}</span>
                  <span className="text-muted text-xs">{b.availableCopies}/{b.totalCopies} available</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "transport" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addVehicle} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <h2 className="font-display font-semibold text-primary-dark mb-1">Add Vehicle</h2>
            <input placeholder="Vehicle Number" value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Driver Name" value={vehicleForm.driverName} onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Driver Contact" value={vehicleForm.driverContact} onChange={(e) => setVehicleForm({ ...vehicleForm, driverContact: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Route Name" value={vehicleForm.routeName} onChange={(e) => setVehicleForm({ ...vehicleForm, routeName: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Vehicle</button>
          </form>
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
            <h2 className="font-display font-semibold text-primary-dark mb-3">Vehicles</h2>
            <ul className="text-sm divide-y divide-black/5">
              {vehicles.length === 0 && <li className="py-2 text-muted">No vehicles yet.</li>}
              {vehicles.map((v) => (
                <li key={v._id} className="py-2 flex justify-between">
                  <span>{v.vehicleNumber} — {v.routeName}</span>
                  <span className="text-muted text-xs">{v.driverName}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "complaints" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addComplaint} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <h2 className="font-display font-semibold text-primary-dark mb-1">Raise Complaint</h2>
            <select value={complaintForm.category} onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm">
              <option value="ACADEMIC">Academic</option>
              <option value="FEE">Fee</option>
              <option value="TRANSPORT">Transport</option>
              <option value="TEACHER">Teacher</option>
              <option value="GENERAL">General</option>
              <option value="TECHNICAL">Technical</option>
            </select>
            <input placeholder="Subject" value={complaintForm.subject} onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <textarea placeholder="Description" value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" rows={3} required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Submit Ticket</button>
          </form>
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
            <h2 className="font-display font-semibold text-primary-dark mb-3">Tickets</h2>
            <ul className="text-sm divide-y divide-black/5">
              {complaints.length === 0 && <li className="py-2 text-muted">No tickets yet.</li>}
              {complaints.map((c) => (
                <li key={c._id} className="py-2 flex justify-between">
                  <span>#{c.ticketNumber} — {c.subject}</span>
                  <span className="text-muted text-xs">{c.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addEvent} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <h2 className="font-display font-semibold text-primary-dark mb-1">Add Event</h2>
            <input placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <select value={eventForm.eventType} onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm">
              <option value="HOLIDAY">Holiday</option>
              <option value="EXAM">Exam</option>
              <option value="PTM">PTM</option>
              <option value="SPORTS">Sports</option>
              <option value="TRIP">Trip</option>
              <option value="FUNCTION">Function</option>
            </select>
            <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Event</button>
          </form>
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
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
