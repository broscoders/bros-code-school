import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Wallet, Smartphone, X, CheckCircle2, Loader2 } from "lucide-react";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-success/10 text-success",
  PARTIAL: "bg-warning/10 text-warning",
  PENDING: "bg-canvas text-muted",
  OVERDUE: "bg-danger/10 text-danger",
  CANCELLED: "bg-canvas text-muted line-through",
};

export default function ParentFees() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<{ status: string; message: string } | null>(null);
  const [payError, setPayError] = useState("");

  const loadInvoices = () => {
    if (selectedChildId) api.get(`/ops/invoices?studentId=${selectedChildId}`).then((res) => setInvoices(res.data));
  };

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
  }, [user]);

  useEffect(loadInvoices, [selectedChildId]);

  const openPayModal = (invoice: any) => {
    setPayingInvoice(invoice);
    setPayAmount(String((invoice.amount - (invoice.paidAmount || 0)).toFixed(2)));
    setMobileNumber("");
    setPayResult(null);
    setPayError("");
  };

  const pollStatus = async (txnRefNo: string, attempt = 0) => {
    if (attempt > 10) return; // ~30s of polling, then leave it to the parent to check back
    try {
      const res = await api.get(`/finance/jazzcash/transactions/${txnRefNo}`);
      if (res.data.status === "PENDING") {
        setTimeout(() => pollStatus(txnRefNo, attempt + 1), 3000);
      } else {
        setPayResult({ status: res.data.status, message: res.data.responseMessage || "" });
        if (res.data.status === "SUCCESS") loadInvoices();
      }
    } catch {
      // stop polling silently - the transaction status endpoint itself failed
    }
  };

  const submitPayment = async () => {
    setPayError("");
    if (!/^03\d{9}$/.test(mobileNumber)) {
      setPayError("Enter a valid JazzCash number, e.g. 03001234567");
      return;
    }
    setPaying(true);
    try {
      const res = await api.post(`/finance/jazzcash/invoices/${payingInvoice._id}/initiate`, {
        mobileNumber,
        amount: Number(payAmount),
      });
      setPayResult({ status: res.data.status, message: res.data.message });
      if (res.data.status === "SUCCESS") {
        loadInvoices();
      } else if (res.data.status === "PENDING") {
        pollStatus(res.data.txnRefNo);
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setPayError(err.response.data.message);
      } else {
        setPayError(err.response?.data?.message || "Payment could not be started. Please try again.");
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Monitoring</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Wallet size={22} className="text-primary" />Fees</h1>
      </div>
      <div className="mt-6"><ChildSwitcher children={children} /></div>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium"></th></tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No invoices yet.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="border-t border-border">
                  <td className="p-3">{inv.feeType}</td>
                  <td className="p-3">{inv.amount} {inv.paidAmount > 0 && <span className="text-xs text-muted">({inv.paidAmount} paid)</span>}</td>
                  <td className="p-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status] || ""}`}>{inv.status}</span>
                  </td>
                  <td className="p-3 text-right">
                    {(inv.status === "PENDING" || inv.status === "PARTIAL" || inv.status === "OVERDUE") && (
                      <button onClick={() => openPayModal(inv)} className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 ml-auto">
                        <Smartphone size={13} />Pay via JazzCash
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !paying && setPayingInvoice(null)}>
          <div className="bg-surface rounded-xl border border-border shadow-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-ink flex items-center gap-2"><Smartphone size={18} className="text-primary" />Pay via JazzCash</h3>
              <button onClick={() => setPayingInvoice(null)} className="text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-4">
              {payResult ? (
                <div className="text-center py-4">
                  {payResult.status === "SUCCESS" ? (
                    <>
                      <CheckCircle2 size={40} className="text-success mx-auto mb-2" />
                      <p className="text-sm text-ink font-medium">Payment successful!</p>
                    </>
                  ) : payResult.status === "PENDING" ? (
                    <>
                      <Loader2 size={32} className="text-primary mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-ink font-medium">Waiting for confirmation...</p>
                      <p className="text-xs text-muted mt-1">Approve the payment prompt on your phone. This may take a moment.</p>
                    </>
                  ) : (
                    <p className="text-sm text-danger font-medium">{payResult.message || "Payment failed. Please try again."}</p>
                  )}
                  {payResult.status !== "PENDING" && (
                    <button onClick={() => setPayingInvoice(null)} className="mt-4 text-sm text-primary hover:text-primary-dark">Close</button>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted mb-3">Enter your JazzCash-registered mobile number to pay this fee directly from your wallet balance.</p>
                  {payError && <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-xs">{payError}</div>}
                  <label className="block text-xs font-medium text-muted mb-1">Amount to pay</label>
                  <input type="number" min="1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3" />
                  <label className="block text-xs font-medium text-muted mb-1">JazzCash mobile number</label>
                  <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="03001234567" className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-4" />
                  <button onClick={submitPayment} disabled={paying} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
                    {paying ? "Processing..." : "Pay Now"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
