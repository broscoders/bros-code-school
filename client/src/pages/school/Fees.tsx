import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Fees() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", feeType: "", amount: "", dueDate: "" });

  useEffect(() => {
    if (schoolId) api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
  }, [schoolId]);

  const loadInvoices = async () => {
    if (!studentId) return;
    const res = await api.get(`/ops/invoices?studentId=${studentId}`);
    setInvoices(res.data);
  };

  const addInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/invoices", { ...form, schoolId });
    setForm({ studentId: form.studentId, feeType: "", amount: "", dueDate: "" });
    if (form.studentId === studentId) loadInvoices();
  };

  const payInvoice = async (id: string) => {
    await api.put(`/ops/invoices/${id}/pay`, { paidAmount: 0 });
    loadInvoices();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Finance</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Fees</h1>
      <p className="text-muted mt-1 text-sm">Create invoices and track payments per student.</p>

      <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-3">Create Invoice</h2>
        <form onSubmit={addInvoice} className="grid grid-cols-2 gap-3">
          <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required>
            <option value="">Select Student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
          </select>
          <input placeholder="Fee Type (e.g. Tuition)" value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required />
          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Create Invoice</button>
        </form>
      </div>

      <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-3">View Invoices</h2>
        <div className="flex gap-2 mb-4">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="border border-black/10 rounded-md px-3 py-2 text-sm flex-1">
            <option value="">Select a student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
          </select>
          <button onClick={loadInvoices} className="bg-primary-dark text-white px-4 py-2 rounded-md text-sm">Load</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-2 font-medium">Type</th><th className="p-2 font-medium">Amount</th><th className="p-2 font-medium">Due Date</th><th className="p-2 font-medium">Status</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-muted">No invoices loaded.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="border-t border-black/5">
                  <td className="p-2">{inv.feeType}</td>
                  <td className="p-2">{inv.amount}</td>
                  <td className="p-2">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="p-2">{inv.status}</td>
                  <td className="p-2">
                    {inv.status !== "PAID" && (
                      <button onClick={() => payInvoice(inv._id)} className="text-primary text-xs underline">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

