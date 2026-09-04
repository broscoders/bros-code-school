import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { GraduationCap, UserCheck, UserX, Award } from "lucide-react";
import StatCard from "../../components/StatCard";

const STATUS_TABS = ["ACTIVE", "ON_LEAVE", "TRANSFERRED", "RESIGNED", "TERMINATED"];
const statusColors: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  ON_LEAVE: "bg-warning/10 text-warning",
  TRANSFERRED: "bg-canvas text-muted",
  RESIGNED: "bg-canvas text-muted",
  TERMINATED: "bg-danger/10 text-danger",
};

export default function Teachers() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const user = useAuthStore((s) => s.user);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", employeeId: "", qualification: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [managingTeacher, setManagingTeacher] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({ employmentStatus: "ACTIVE", reason: "" });

  const loadTeachers = async (status = statusFilter) => {
    const res = await api.get(`/people/teachers?schoolId=${schoolId}&status=${status}`);
    setTeachers(res.data);
  };

  useEffect(() => {
    if (schoolId) loadTeachers();
  }, [schoolId, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const userRes = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "TEACHER",
        schoolId,
      });
      try {
        await api.post("/people/teachers", {
          schoolId,
          userId: userRes.data.user.id,
          employeeId: form.employeeId,
          qualification: form.qualification,
        });
      } catch (profileErr: any) {
        setError(
          `The login account for ${form.email} was created, but saving the teacher profile failed: ${profileErr.response?.data?.message || "unknown error"}. Please check the Teachers list before retrying.`
        );
        setSubmitting(false);
        return;
      }
      setShowForm(false);
      setForm({ name: "", email: "", password: "", employeeId: "", qualification: "" });
      loadTeachers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const openManage = (teacher: any) => {
    setManagingTeacher(teacher);
    setStatusForm({ employmentStatus: teacher.employmentStatus || "ACTIVE", reason: "" });
  };

  const saveStatus = async () => {
    if (!managingTeacher) return;
    await api.put(`/people/teachers/${managingTeacher._id}/status`, { ...statusForm, changedByName: user?.name });
    setManagingTeacher(null);
    loadTeachers();
  };

  const totalCount = teachers.length;
  const activeCount = teachers.filter((t: any) => (t.employmentStatus || "ACTIVE") === "ACTIVE").length;
  const onLeaveCount = teachers.filter((t: any) => t.employmentStatus === "ON_LEAVE").length;
  const exitedCount = teachers.filter((t: any) => ["RESIGNED", "TERMINATED", "TRANSFERRED"].includes(t.employmentStatus)).length;

  return (
    <div className="p-8">
      <div className="flex justify-between items-end gap-4 border-b border-border pb-5 mb-6">
        <div>
          <p className="section-label">People</p>
          <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Teachers</h1>
          <p className="text-muted mt-1 text-sm">Manage all teachers of your school.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
          {showForm ? "Cancel" : "+ Add Teacher"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Teachers" value={totalCount} icon={GraduationCap} tone="primary" />
        <StatCard label="Active" value={activeCount} icon={UserCheck} tone="success" />
        <StatCard label="On Leave" value={onLeaveCount} icon={Award} tone="accent" />
        <StatCard label="Resigned / Transferred" value={exitedCount} icon={UserX} tone="danger" />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4 grid grid-cols-2 gap-4">
          {error && <p className="text-danger text-sm col-span-2">{error}</p>}
          <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" />
          <button type="submit" disabled={submitting} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Saving..." : "Save Teacher"}
          </button>
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

      <div className="bg-surface rounded-xl border border-border shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">Employee ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Qualification</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No teachers in this status.</td></tr>
            ) : (
              teachers.map((t) => (
                <tr key={t._id} className="border-t border-border">
                  <td className="p-3">{t.employeeId}</td>
                  <td className="p-3">{t.userId?.name}</td>
                  <td className="p-3">{t.userId?.email}</td>
                  <td className="p-3">{t.qualification}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.employmentStatus] || "bg-canvas text-muted"}`}>{(t.employmentStatus || "ACTIVE").replace("_", " ")}</span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => openManage(t)} className="text-primary text-xs underline">Manage</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {managingTeacher && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setManagingTeacher(null)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-ink mb-1">{managingTeacher.userId?.name}</h2>
            <p className="text-muted text-xs mb-4">Change employment status</p>
            <select value={statusForm.employmentStatus} onChange={(e) => setStatusForm({ ...statusForm, employmentStatus: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2">
              {STATUS_TABS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <textarea placeholder="Reason (optional)" value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-4" rows={2} />
            <div className="flex gap-2">
              <button onClick={saveStatus} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 hover:bg-primary-dark transition-colors">Save</button>
              <button onClick={() => setManagingTeacher(null)} className="border border-border text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-canvas transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
