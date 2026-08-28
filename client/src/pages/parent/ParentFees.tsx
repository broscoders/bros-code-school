import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Wallet } from "lucide-react";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

export default function ParentFees() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
  }, [user]);

  useEffect(() => {
    if (selectedChildId) api.get(`/ops/invoices?studentId=${selectedChildId}`).then((res) => setInvoices(res.data));
  }, [selectedChildId]);

  return (
    <div className="p-8">
      <p className="section-label">Monitoring</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Wallet size={22} className="text-primary" />Fees</h1>
      <div className="mt-6"><ChildSwitcher children={children} /></div>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No invoices yet.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="border-t border-border">
                  <td className="p-3">{inv.feeType}</td>
                  <td className="p-3">{inv.amount}</td>
                  <td className="p-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="p-3">{inv.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
