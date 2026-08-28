import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Accounting() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "expenses" | "discounts" | "refunds">("overview");

  const [expenseForm, setExpenseForm] = useState({ category: "", description: "", amount: "", vendor: "" });
  const [discountForm, setDiscountForm] = useState({ studentId: "", type: "DISCOUNT", reason: "", percentage: "" });
  const [refundForm, setRefundForm] = useState({ studentId: "", amount: "", reason: "" });

  const loadAll = async () => {
    const [s, e, d, r] = await Promise.all([
      api.get(`/finance/summary?schoolId=${schoolId}`),
      api.get(`/finance/expenses?schoolId=${schoolId}`),
      api.get(`/finance/discounts?schoolId=${schoolId}`),
      api.get(`/finance/refunds?schoolId=${schoolId}`),
    ]);
    setSummary(s.data);
    setExpenses(e.data);
    setDiscounts(d.data);
    setRefunds(r.data);
  };

  useEffect(() => {
    if (schoolId) {
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
      loadAll();
    }
  }, [schoolId]);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/finance/expenses", { ...expenseForm, schoolId });
    setExpenseForm({ category: "", description: "", amount: "", vendor: "" });
    loadAll();
  };

  const addDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/finance/discounts", { ...discountForm, schoolId });
    setDiscountForm({ studentId: "", type: "DISCOUNT", reason: "", percentage: "" });
    loadAll();
  };

  const addRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/finance/refunds", { ...refundForm, schoolId });
    setRefundForm({ studentId: "", amount: "", reason: "" });
    loadAll();
  };

  const updateRefund = async (id: string, status: string) => {
    await api.put(`/finance/refunds/${id}/status`, { status });
    loadAll();
  };

  const updateDiscount = async (id: string, status: string) => {
    await api.put(`/finance/discounts/${id}/status`, { status });
    loadAll();
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "expenses", label: "Expenses" },
    { id: "discounts", label: "Discounts/Scholarships" },
    { id: "refunds", label: "Refunds" },
  ] as const;

  return (
    <div className="p-8">
      <p className="section-label">Finance</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Accounting</h1>
      <p className="text-muted mt-1 text-sm">Income, expenses, discounts and refunds.</p>

      <div className="flex gap-1 mt-6 border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? "border-primary text-ink" : "border-transparent text-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && summary && (
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Collected</p>
            <p className="text-xl font-display font-bold text-success mt-1">Rs. {summary.totalCollected}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Pending</p>
            <p className="text-xl font-display font-bold text-accent mt-1">Rs. {summary.totalPending}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Expenses</p>
            <p className="text-xl font-display font-bold text-danger mt-1">Rs. {summary.totalExpenses}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Net Income</p>
            <p className="text-xl font-display font-bold text-primary mt-1">Rs. {summary.netIncome}</p>
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addExpense} className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-2 h-fit">
            <input placeholder="Category (e.g. Utilities)" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input type="number" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Vendor (optional)" value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">+ Record Expense</button>
          </form>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <ul className="text-sm divide-y divide-black/5">
              {expenses.length === 0 && <li className="py-2 text-muted">No expenses recorded.</li>}
              {expenses.map((e) => (
                <li key={e._id} className="py-2 flex justify-between">
                  <span>{e.category} - {e.description}</span>
                  <span className="text-danger font-medium">Rs. {e.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "discounts" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addDiscount} className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-2 h-fit">
            <select value={discountForm.studentId} onChange={(e) => setDiscountForm({ ...discountForm, studentId: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name}</option>)}
            </select>
            <select value={discountForm.type} onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              <option value="DISCOUNT">Discount</option>
              <option value="SCHOLARSHIP">Scholarship</option>
            </select>
            <input placeholder="Reason" value={discountForm.reason} onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input type="number" placeholder="Percentage (e.g. 20)" value={discountForm.percentage} onChange={(e) => setDiscountForm({ ...discountForm, percentage: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">+ Add</button>
          </form>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <ul className="text-sm divide-y divide-black/5">
              {discounts.length === 0 && <li className="py-2 text-muted">No discounts/scholarships yet.</li>}
              {discounts.map((d) => (
                <li key={d._id} className="py-2 flex justify-between items-center">
                  <span>{d.studentId?.userId?.name} - {d.reason} <span className="text-accent">({d.type} {d.percentage ? `${d.percentage}%` : ""})</span></span>
                  {d.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button onClick={() => updateDiscount(d._id, "APPROVED")} className="text-success text-xs underline">Approve</button>
                      <button onClick={() => updateDiscount(d._id, "REJECTED")} className="text-danger text-xs underline">Reject</button>
                    </div>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === "APPROVED" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>{d.status}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "refunds" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addRefund} className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-2 h-fit">
            <select value={refundForm.studentId} onChange={(e) => setRefundForm({ ...refundForm, studentId: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name}</option>)}
            </select>
            <input type="number" placeholder="Amount" value={refundForm.amount} onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Reason" value={refundForm.reason} onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">+ Request Refund</button>
          </form>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <ul className="text-sm divide-y divide-black/5">
              {refunds.length === 0 && <li className="py-2 text-muted">No refund requests yet.</li>}
              {refunds.map((r) => (
                <li key={r._id} className="py-2 flex justify-between items-center">
                  <span>{r.studentId?.userId?.name} - Rs. {r.amount}</span>
                  {r.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button onClick={() => updateRefund(r._id, "APPROVED")} className="text-success text-xs underline">Approve</button>
                      <button onClick={() => updateRefund(r._id, "REJECTED")} className="text-danger text-xs underline">Reject</button>
                    </div>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "APPROVED" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>{r.status}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
