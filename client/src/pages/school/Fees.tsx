import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Wallet, Receipt } from "lucide-react";

const statusStyles: Record<string, string> = {
  PENDING: "bg-white/5 text-muted",
  PARTIAL: "bg-warning-soft text-warning",
  PAID: "bg-success-soft text-success",
  OVERDUE: "bg-danger-soft text-danger",
  CANCELLED: "bg-white/5 text-muted line-through",
};

export default function Fees() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", feeType: "", amount: "", dueDate: "" });
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (schoolId) api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
  }, [schoolId]);

  const loadInvoices = async (forId?: string) => {
    const id = forId || studentId;
    if (!id) return;
    const res = await api.get(`/ops/invoices?studentId=${id}`);
    setInvoices(res.data);
  };

  const addInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/invoices", { ...form, schoolId });
    setForm({ studentId: form.studentId, feeType: "", amount: "", dueDate: "" });
    if (form.studentId === studentId) loadInvoices();
  };

  const recordPayment = async (invoiceId: string) => {
    const amount = Number(payAmounts[invoiceId]);
    if (!amount || amount <= 0) {
      setMsg("Enter a valid payment amount");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    try {
      await api.put(`/ops/invoices/${invoiceId}/pay`, { amount });
      setPayAmounts({ ...payAmounts, [invoiceId]: "" });
      loadInvoices();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Payment failed");
      setTimeout(() => setMsg(""), 2500);
    }
  };

  const totalDue = invoices.reduce((sum, i) => sum + (i.amount - (i.paidAmount || 0)), 0);
  const totalCollected = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Finance</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Wallet size={22} className="text-primary" />
          Fees
        </h1>
        <p className="text-muted mt-1 text-sm">Create invoices and track partial or full payments.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
        <h2 className="font-display font-semibold text-ink mb-3">Create Invoice</h2>
        <form onSubmit={addInvoice} className="grid grid-cols-2 gap-3">
          <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="col-span-2" required>
            <option value="">Select Student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
          </select>
          <input placeholder="Fee Type (e.g. Tuition)" value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} required />
          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="col-span-2" required />
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">
            + Create Invoice
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
        <h2 className="font-display font-semibold text-ink mb-3 flex items-center gap-2">
          <Receipt size={16} className="text-primary" />
          Invoices
        </h2>
        <div className="flex gap-2 mb-4">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="flex-1">
            <option value="">Select a student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
          </select>
          <button onClick={() => loadInvoices()} className="bg-primary-dark text-white px-4 py-2 rounded-lg text-sm">Load</button>
        </div>

        {invoices.length > 0 && (
          <div className="flex gap-6 mb-4 text-sm">
            <span className="text-ink">Total Collected: <strong className="text-success">Rs. {totalCollected.toLocaleString()}</strong></span>
            <span className="text-ink">Total Due: <strong className="text-danger">Rs. {totalDue.toLocaleString()}</strong></span>
          </div>
        )}

        {msg && <p className="text-danger text-sm mb-3">{msg}</p>}

        <table className="w-full text-sm">
          <thead className="text-left text-muted border-b border-border">
            <tr>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Amount</th>
              <th className="p-2 font-medium">Paid</th>
              <th className="p-2 font-medium">Balance</th>
              <th className="p-2 font-medium">Due Date</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Record Payment</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted">No invoices loaded.</td></tr>
            ) : (
              invoices.map((inv) => {
                const balance = inv.amount - (inv.paidAmount || 0);
                const isSettled = inv.status === "PAID" || inv.status === "CANCELLED";
                return (
                  <tr key={inv._id} className="border-t border-border">
                    <td className="p-2 text-ink">{inv.feeType}</td>
                    <td className="p-2 text-ink">Rs. {inv.amount.toLocaleString()}</td>
                    <td className="p-2 text-ink">Rs. {(inv.paidAmount || 0).toLocaleString()}</td>
                    <td className="p-2 text-ink font-medium">Rs. {balance.toLocaleString()}</td>
                    <td className="p-2 text-muted">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[inv.status] || statusStyles.PENDING}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-2">
                      {!isSettled && (
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            placeholder="Amount"
                            value={payAmounts[inv._id] || ""}
                            onChange={(e) => setPayAmounts({ ...payAmounts, [inv._id]: e.target.value })}
                            className="w-24 text-xs px-2 py-1"
                          />
                          <button
                            onClick={() => recordPayment(inv._id)}
                            className="bg-success text-white text-xs px-2.5 py-1 rounded-md font-medium hover:opacity-90"
                          >
                            Pay
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}