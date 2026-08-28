import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { ClipboardList, UserPlus } from "lucide-react";

const statusColors: Record<string, string> = {
  APPLICATION: "bg-white/5 text-muted",
  REVIEW: "bg-warning-soft text-warning",
  INTERVIEW: "bg-primary/10 text-primary",
  APPROVED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger",
  CONVERTED: "bg-accent-soft text-accent",
};

export default function Admissions() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ applicantName: "", parentName: "", parentContact: "", desiredClassId: "", academicSystem: "" });
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState({ email: "", parentEmail: "", dateOfBirth: "", gender: "Male", sectionId: "", admissionNumber: "" });
  const [convertMsg, setConvertMsg] = useState("");
  const [converting, setConverting] = useState(false);

  const load = async () => {
    const res = await api.get(`/admissions?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
      load();
    }
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/admissions", { ...form, schoolId });
    setForm({ applicantName: "", parentName: "", parentContact: "", desiredClassId: "", academicSystem: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/admissions/${id}/status`, { status });
    load();
  };

  const openConvert = async (admission: any) => {
    setConvertingId(admission._id);
    setConvertMsg("");
    setConvertForm({ email: "", parentEmail: "", dateOfBirth: "", gender: "Male", sectionId: "", admissionNumber: "" });
    const res = await api.get(`/academics/sections?classId=${admission.desiredClassId}`).catch(() => ({ data: [] }));
    setSections(res.data || []);
  };

  const submitConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingId) return;
    setConverting(true);
    setConvertMsg("");
    try {
      await api.post(`/admissions/${convertingId}/convert`, convertForm);
      setConvertMsg("Success! Student and parent accounts created and emailed.");
      setTimeout(() => {
        setConvertingId(null);
        load();
      }, 1800);
    } catch (err: any) {
      setConvertMsg(err.response?.data?.message || "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Enrollment</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <ClipboardList size={22} className="text-primary" />
          Admissions
        </h1>
        <p className="text-muted mt-1 text-sm">Manage the admission pipeline from application to enrollment.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <input placeholder="Applicant Name" value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} required />
        <input placeholder="Parent Name" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} required />
        <input placeholder="Parent Contact" value={form.parentContact} onChange={(e) => setForm({ ...form, parentContact: e.target.value })} required />
        <select value={form.desiredClassId} onChange={(e) => setForm({ ...form, desiredClassId: e.target.value })} required>
          <option value="">Desired Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input placeholder="Academic System (e.g. Matric)" value={form.academicSystem} onChange={(e) => setForm({ ...form, academicSystem: e.target.value })} className="col-span-2" required />
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">
          + Submit Application
        </button>
      </form>

      <div className="bg-surface rounded-xl border border-border shadow-sm mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-ink-soft text-left">
            <tr>
              <th className="p-3 font-medium">Applicant</th>
              <th className="p-3 font-medium">Parent</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No applications yet.</td></tr>
            ) : (
              list.map((a) => (
                <tr key={a._id} className="border-t border-border">
                  <td className="p-3 text-ink">{a.applicantName}</td>
                  <td className="p-3 text-ink">{a.parentName}</td>
                  <td className="p-3 text-muted">{a.parentContact}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="p-3">
                    {a.status === "APPROVED" ? (
                      <button
                        onClick={() => openConvert(a)}
                        className="flex items-center gap-1.5 text-xs bg-success text-white px-2.5 py-1.5 rounded-md font-medium hover:opacity-90"
                      >
                        <UserPlus size={12} />
                        Convert to Student
                      </button>
                    ) : a.status === "CONVERTED" ? (
                      <span className="text-xs text-muted">Enrolled</span>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => e.target.value && updateStatus(a._id, e.target.value)}
                        className="text-xs px-2 py-1"
                      >
                        <option value="">Change status</option>
                        <option value="REVIEW">Review</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {convertingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="font-display font-semibold text-ink mb-1">Convert to Student</h2>
            <p className="text-xs text-muted mb-4">This creates a Student account and a Parent account, and emails login details to both.</p>
            <form onSubmit={submitConvert} className="space-y-2">
              <input type="email" placeholder="Student Email" value={convertForm.email} onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })} className="w-full" required />
              <input type="email" placeholder="Parent Email" value={convertForm.parentEmail} onChange={(e) => setConvertForm({ ...convertForm, parentEmail: e.target.value })} className="w-full" required />
              <input type="date" placeholder="Date of Birth" value={convertForm.dateOfBirth} onChange={(e) => setConvertForm({ ...convertForm, dateOfBirth: e.target.value })} className="w-full" required />
              <select value={convertForm.gender} onChange={(e) => setConvertForm({ ...convertForm, gender: e.target.value })} className="w-full">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select value={convertForm.sectionId} onChange={(e) => setConvertForm({ ...convertForm, sectionId: e.target.value })} className="w-full">
                <option value="">Select Section (optional)</option>
                {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <input placeholder="Admission Number" value={convertForm.admissionNumber} onChange={(e) => setConvertForm({ ...convertForm, admissionNumber: e.target.value })} className="w-full" required />

              {convertMsg && (
                <p className={`text-xs ${convertMsg.startsWith("Success") ? "text-success" : "text-danger"}`}>{convertMsg}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setConvertingId(null)} className="flex-1 border border-border text-ink-soft py-2 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={converting} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                  {converting ? "Creating..." : "Create Accounts"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}