import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Papa from "papaparse";
import { Upload } from "lucide-react";

const STATUS_TABS = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TRANSFERRED", "WITHDRAWN", "GRADUATED", "ALUMNI"];
const statusColors: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  ON_LEAVE: "bg-warning/10 text-warning",
  SUSPENDED: "bg-danger/10 text-danger",
  TRANSFERRED: "bg-canvas text-muted",
  WITHDRAWN: "bg-canvas text-muted",
  GRADUATED: "bg-primary/10 text-primary",
  ALUMNI: "bg-primary/10 text-primary",
};

export default function Students() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const user = useAuthStore((s) => s.user);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", admissionNumber: "", classId: "", sectionId: "" });
  const [error, setError] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [managingStudent, setManagingStudent] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({ status: "ACTIVE", reason: "" });

  const loadStudents = async (status = statusFilter) => {
    const res = await api.get(`/people/students?schoolId=${schoolId}&status=${status}`);
    setStudents(res.data);
  };

  const loadClasses = async () => {
    const res = await api.get(`/academics/classes?schoolId=${schoolId}`);
    setClasses(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      loadStudents();
      loadClasses();
    }
  }, [schoolId, statusFilter]);

  useEffect(() => {
    if (form.classId) {
      api.get(`/academics/sections?classId=${form.classId}`).then((res) => setSections(res.data));
    } else {
      setSections([]);
    }
  }, [form.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userRes = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "STUDENT",
        schoolId,
      });
      await api.post("/people/students", {
        schoolId,
        userId: userRes.data.user.id,
        admissionNumber: form.admissionNumber,
        classId: form.classId,
        sectionId: form.sectionId,
      });
      setShowForm(false);
      setForm({ name: "", email: "", password: "", admissionNumber: "", classId: "", sectionId: "" });
      loadStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add student");
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        setImportMsg("Importing...");
        const res = await api.post("/bulk/students", { rows, schoolId });
        setImportMsg(`Imported: ${res.data.created}, Skipped: ${res.data.skipped}`);
        loadStudents();
      },
    });
  };

  const openManage = (student: any) => {
    setManagingStudent(student);
    setStatusForm({ status: student.status || "ACTIVE", reason: "" });
  };

  const saveStatus = async () => {
    if (!managingStudent) return;
    await api.put(`/people/students/${managingStudent._id}/status`, { ...statusForm, changedByName: user?.name });
    setManagingStudent(null);
    loadStudents();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">People</p>
          <h1 className="font-display text-2xl font-bold text-ink mt-1">Students</h1>
          <p className="text-muted mt-1 text-sm">Manage all students of your school.</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 bg-surface border border-black/10 text-ink px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-canvas">
            <Upload size={15} />
            Bulk Import CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            {showForm ? "Cancel" : "+ Add Student"}
          </button>
        </div>
      </div>

      {importMsg && <p className="text-success text-sm mt-3">{importMsg}</p>}
      <p className="text-xs text-muted mt-2">CSV columns required: name, email, admissionNumber, classId, sectionId. Default password will be "changeme123".</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 mt-4 grid grid-cols-2 gap-4">
          {error && <p className="text-danger text-sm col-span-2">{error}</p>}
          <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Admission Number" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
          <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required>
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required disabled={!form.classId}>
            <option value="">Select Section</option>
            {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">Save Student</button>
        </form>
      )}

      <div className="flex gap-2 mt-6 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusFilter === s ? "bg-primary text-white" : "bg-canvas text-muted"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
        <button onClick={() => setStatusFilter("ANY")} className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusFilter === "ANY" ? "bg-primary text-white" : "bg-canvas text-muted"}`}>All</button>
      </div>

      <div className="bg-surface rounded-2xl border border-black/5 shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Admission #</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Class</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No students in this status.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id} className="border-t border-black/5">
                  <td className="p-3">{s.admissionNumber}</td>
                  <td className="p-3">{s.userId?.name}</td>
                  <td className="p-3">{s.userId?.email}</td>
                  <td className="p-3 text-muted">{s.classId?.name} {s.sectionId?.name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || "bg-canvas text-muted"}`}>{(s.status || "ACTIVE").replace("_", " ")}</span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => openManage(s)} className="text-primary text-xs underline">Manage</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {managingStudent && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setManagingStudent(null)}>
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-ink mb-1">{managingStudent.userId?.name}</h2>
            <p className="text-muted text-xs mb-4">Change lifecycle status</p>
            <select value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-2">
              {STATUS_TABS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <textarea placeholder="Reason (optional)" value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4" rows={2} />
            <div className="flex gap-2">
              <button onClick={saveStatus} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 hover:bg-primary-dark transition-colors">Save</button>
              <button onClick={() => setManagingStudent(null)} className="border border-black/10 text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-canvas transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
