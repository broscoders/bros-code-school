import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Wallet } from "lucide-react";

export default function Payroll() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [staff, setStaff] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loanForm, setLoanForm] = useState({ staffId: "", amount: "", reason: "", monthlyDeduction: "" });
  const [form, setForm] = useState({ staffId: "", month: "", year: new Date().getFullYear().toString(), allowances: "0", deductions: "0", bonus: "0" });

  const load = async () => {
    const res = await api.get(`/hr/payroll?schoolId=${schoolId}`);
    setRecords(res.data);
    const loanRes = await api.get(`/hr/loans?schoolId=${schoolId}`);
    setLoans(loanRes.data);
  };

  useEffect(() => {
    if (schoolId) {
      api.get(`/hr/staff?schoolId=${schoolId}`).then((res) => setStaff(res.data));
      load();
    }
  }, [schoolId]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/hr/payroll", form);
    setForm({ staffId: "", month: "", year: new Date().getFullYear().toString(), allowances: "0", deductions: "0", bonus: "0" });
    load();
  };

  const markPaid = async (id: string) => {
    await api.put(`/hr/payroll/${id}/pay`, {});
    load();
  };

  const requestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/hr/loans", { ...loanForm, schoolId, amount: Number(loanForm.amount), monthlyDeduction: Number(loanForm.monthlyDeduction) });
    setLoanForm({ staffId: "", amount: "", reason: "", monthlyDeduction: "" });
    load();
  };

  const setLoanStatus = async (id: string, status: string) => {
    await api.put(`/hr/loans/${id}/status`, { status });
    load();
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">HR / Finance</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Wallet size={22} className="text-primary" />Payroll</h1>
        <p className="text-muted mt-1 text-sm">Generate and track staff salary payments.</p>
      </div>

      <form onSubmit={generate} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <label className="block text-xs text-muted mb-1">Staff Member</label>
          <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} className="w-full" required>
            <option value="">Select Staff</option>
            {staff.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} - {s.designation}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Month</label>
          <input placeholder="e.g. August" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full" required />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Year</label>
          <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full" required />
        </div>
        <div></div>
        <div>
          <label className="block text-xs text-muted mb-1">Allowances (Rs.)</label>
          <input type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} className="w-full" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Deductions (Rs.)</label>
          <input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} className="w-full" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Bonus (Rs.)</label>
          <input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} className="w-full" />
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-3 hover:bg-primary-dark transition-colors">+ Generate Payslip</button>
      </form>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Staff</th>
              <th className="p-3 font-medium">Period</th>
              <th className="p-3 font-medium">Net Salary</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No payroll records yet.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r._id} className="border-t border-border">
                  <td className="p-3">{r.staffId?.userId?.name}</td>
                  <td className="p-3">{r.month} {r.year}</td>
                  <td className="p-3">Rs. {r.netSalary}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "PAID" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{r.status}</span>
                  </td>
                  <td className="p-3">
                    {r.status !== "PAID" && <button onClick={() => markPaid(r._id)} className="text-primary text-xs underline">Mark Paid</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border mt-8 pt-6">
        <h2 className="font-display font-semibold text-ink mb-3">Staff Loans / Advances</h2>
        <form onSubmit={requestLoan} className="bg-surface rounded-xl border border-border shadow-sm p-5 grid grid-cols-4 gap-3">
          <select value={loanForm.staffId} onChange={(e) => setLoanForm({ ...loanForm, staffId: e.target.value })} className="w-full" required>
            <option value="">Select Staff</option>
            {staff.map((s) => <option key={s._id} value={s._id}>{s.userId?.name}</option>)}
          </select>
          <input type="number" placeholder="Amount (Rs.)" value={loanForm.amount} onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })} className="w-full" required />
          <input type="number" placeholder="Monthly Deduction (Rs.)" value={loanForm.monthlyDeduction} onChange={(e) => setLoanForm({ ...loanForm, monthlyDeduction: e.target.value })} className="w-full" required />
          <input placeholder="Reason" value={loanForm.reason} onChange={(e) => setLoanForm({ ...loanForm, reason: e.target.value })} className="w-full" required />
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-4 hover:bg-primary-dark transition-colors">+ Request Loan</button>
        </form>

        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-ink text-left">
              <tr><th className="p-3 font-medium">Staff</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Remaining</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Action</th></tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted">No loans yet.</td></tr>
              ) : (
                loans.map((l) => (
                  <tr key={l._id} className="border-t border-border">
                    <td className="p-3">{l.staffId?.userId?.name}</td>
                    <td className="p-3">Rs. {l.amount}</td>
                    <td className="p-3">Rs. {l.remainingBalance}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === "APPROVED" ? "bg-success-soft text-success" : l.status === "REJECTED" ? "bg-danger/10 text-danger" : l.status === "COMPLETED" ? "bg-white/5 text-muted" : "bg-warning-soft text-warning"}`}>{l.status}</span>
                    </td>
                    <td className="p-3">
                      {l.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button onClick={() => setLoanStatus(l._id, "APPROVED")} className="text-success text-xs underline">Approve</button>
                          <button onClick={() => setLoanStatus(l._id, "REJECTED")} className="text-danger text-xs underline">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

