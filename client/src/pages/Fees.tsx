import { useEffect, useState } from "react";
import api from "../services/api";

export default function Fees() {
  const [studentId, setStudentId] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", schoolId: "", feeType: "", amount: "", dueDate: "" });

  const loadInvoices = async () => {
    if (!studentId) return;
    const res = await api.get(`/ops/invoices?studentId=${studentId}`);
    setInvoices(res.data);
  };

  const addInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/invoices", form);
    loadInvoices();
  };

  const payInvoice = async (id: string) => {
    await api.put(`/ops/invoices/${id}/pay`, { paidAmount: 0 });
    loadInvoices();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Fees</h1>
      <p className="text-slate-500 mt-1">Create invoices and track payments per student.</p>

      <div className="bg-white rounded-lg shadow-sm p-5 mt-6">
        <h2 className="font-semibold text-slate-800 mb-3">Create Invoice</h2>
        <form onSubmit={addInvoice} className="grid grid-cols-2 gap-3">
          <input placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
          <input placeholder="School ID" value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Fee Type (e.g. Tuition)" value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="border rounded-md px-3 py-2 text-sm" required />
          <button className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm col-span-2">+ Create Invoice</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5 mt-6">
        <h2 className="font-semibold text-slate-800 mb-3">View Invoices</h2>
        <div className="flex gap-2 mb-4">
          <input placeholder="Enter Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="border rounded-md px-3 py-2 text-sm flex-1" />
          <button onClick={loadInvoices} className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm">Load</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Due Date</th><th className="p-2">Status</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-t">
                <td className="p-2">{inv.feeType}</td>
                <td className="p-2">{inv.amount}</td>
                <td className="p-2">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="p-2">{inv.status}</td>
                <td className="p-2">
                  {inv.status !== "PAID" && (
                    <button onClick={() => payInvoice(inv._id)} className="text-blue-700 text-xs underline">Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
