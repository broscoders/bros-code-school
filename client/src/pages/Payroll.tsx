import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Payroll() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [staff, setStaff] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [form, setForm] = useState({ staffId: "", month: "", year: new Date().getFullYear().toString(), allowances: "0", deductions: "0", bonus: "0" });

  const load = async () => {
    const res = await api.get(`/hr/payroll?schoolId=${schoolId}`);
    setRecords(res.data);
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

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">HR / Finance</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Payroll</h1>
      <p className="text-muted mt-1 text-sm">Generate and track staff salary payments.</p>

      <form onSubmit={generate} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 mt-6 grid grid-cols-3 gap-3">
        <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm col-span-3" required>
          <option value="">Select Staff</option>
          {staff.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} - {s.designation}</option>)}
        </select>
        <input placeholder="Month (e.g. August)" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
        <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
        <input type="number" placeholder="Allowances" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Deductions" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Bonus" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" />
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-3 hover:bg-primary-dark transition-colors">+ Generate Payslip</button>
      </form>

      <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden mt-6">
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
                <tr key={r._id} className="border-t border-black/5">
                  <td className="p-3">{r.staffId?.userId?.name}</td>
                  <td className="p-3">{r.month} {r.year}</td>
                  <td className="p-3">Rs. {r.netSalary}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
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
    </div>
  );
}
