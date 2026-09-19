import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Discount from "../models/Discount";
import Refund from "../models/Refund";
import Invoice from "../models/Invoice";
import Expense from "../models/Expense";
import User from "../models/User";
import JazzCashTransaction from "../models/JazzCashTransaction";
import { logAudit } from "../utils/auditLogger";
import { canAccessStudent } from "../utils/accessControl";
import { callJazzCashMWallet, generateTxnRefNo, getJazzCashCredentials } from "../utils/jazzcash";

// Blueprint 36/85: online fee payment via JazzCash mobile wallet. Unlike
// the plain payInvoice (staff-recorded, offline payments), this one IS
// safe for a parent to call directly - the money only actually moves
// (and only gets applied to the invoice) once JazzCash's own signed
// response confirms success, not from anything the client claims.
export const initiateJazzCashPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!getJazzCashCredentials()) {
      return res.status(503).json({ message: "Online payment is not configured for this school yet. Please pay through the school office." });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const allowed = await canAccessStudent(req, invoice.studentId.toString());
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student's invoice" });

    const remaining = invoice.amount - (invoice.paidAmount || 0);
    if (remaining <= 0) return res.status(400).json({ message: "This invoice is already fully paid" });

    const amount = Math.min(Number(req.body.amount) || remaining, remaining);
    if (amount <= 0) return res.status(400).json({ message: "Payment amount must be greater than zero" });

    const mobileNumber = (req.body.mobileNumber || "").replace(/\D/g, "");
    if (!/^03\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({ message: "Enter a valid JazzCash-registered mobile number (e.g. 03xxxxxxxxx)" });
    }

    const txnRefNo = generateTxnRefNo();
    const transaction = await JazzCashTransaction.create({
      schoolId: req.user!.schoolId,
      invoiceId: invoice._id,
      studentId: invoice.studentId,
      initiatedByUserId: req.user!.userId,
      txnRefNo,
      amount,
      mobileNumber,
      status: "INITIATED",
    });

    let apiResponse;
    try {
      apiResponse = await callJazzCashMWallet({
        txnRefNo,
        amountInPaisa: Math.round(amount * 100),
        mobileNumber,
        description: `Fee payment - Invoice ${invoice._id.toString().slice(-8)}`,
      });
    } catch (apiErr) {
      transaction.status = "FAILED";
      transaction.responseMessage = (apiErr as Error).message;
      await transaction.save();
      return res.status(502).json({ message: "Could not reach JazzCash. Please try again shortly." });
    }

    transaction.responseCode = apiResponse.pp_ResponseCode;
    transaction.responseMessage = apiResponse.pp_ResponseMessage;
    transaction.jazzcashTxnId = apiResponse.pp_RetreivalReferenceNo as string | undefined;
    transaction.rawResponse = JSON.stringify(apiResponse);

    // "000" is JazzCash's documented success code. Anything indicating the
    // customer needs to approve on their phone is left PENDING for a
    // status-check poll; everything else is treated as failed.
    if (apiResponse.pp_ResponseCode === "000") {
      transaction.status = "SUCCESS";
      await transaction.save();

      // Same atomic $inc pattern as payInvoice - see the comment there for
      // why this can't be a read-then-write.
      const updatedInvoice = await Invoice.findOneAndUpdate(
        { _id: invoice._id, schoolId: req.user!.schoolId },
        { $inc: { paidAmount: amount }, $set: { paidDate: new Date() } },
        { new: true }
      );
      if (updatedInvoice) {
        const newStatus = (updatedInvoice.paidAmount || 0) >= updatedInvoice.amount ? "PAID" : "PARTIAL";
        if (updatedInvoice.status !== newStatus) {
          updatedInvoice.status = newStatus;
          await updatedInvoice.save();
        }
        await logAudit({
          schoolId: req.user!.schoolId,
          userId: req.user!.userId,
          userName: (req.body.paidByName as string) || "Parent",
          userRole: req.user!.role,
          action: "Paid invoice via JazzCash",
          recordType: "Invoice",
          recordId: updatedInvoice._id.toString(),
          newValue: { status: updatedInvoice.status, paidAmount: updatedInvoice.paidAmount, amount, txnRefNo },
        });
      }

      return res.json({ status: "SUCCESS", message: "Payment successful", invoice: updatedInvoice, txnRefNo });
    }

    const pendingCodes = ["124", "125"]; // JazzCash: transaction pending / awaiting customer confirmation
    transaction.status = pendingCodes.includes(apiResponse.pp_ResponseCode || "") ? "PENDING" : "FAILED";
    await transaction.save();

    res.json({
      status: transaction.status,
      message: apiResponse.pp_ResponseMessage || "Payment could not be completed",
      txnRefNo,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Poll this after a PENDING result - e.g. the customer had to approve the
// charge on their phone and the parent's browser is waiting to hear back.
export const getJazzCashTransactionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await JazzCashTransaction.findOne({ txnRefNo: req.params.txnRefNo, schoolId: req.user!.schoolId });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const allowed = await canAccessStudent(req, transaction.studentId.toString());
    if (!allowed) return res.status(403).json({ message: "Not authorized" });

    res.json({ status: transaction.status, amount: transaction.amount, responseMessage: transaction.responseMessage });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createDiscount = async (req: AuthRequest, res: Response) => {
  try {
    // FINANCE_STAFF may create a discount request but only TOP_ADMIN can
    // approve one (see updateDiscountStatus below) - without stripping
    // these fields, a finance-staff member could include "status":
    // "APPROVED" in this request body and self-approve, skipping the
    // separate, more-privileged approval step entirely.
    const { status, approvedBy, isActive, ...safeBody } = req.body;
    const discount = await Discount.create({ ...safeBody, schoolId: req.user!.schoolId });
    res.status(201).json(discount);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getDiscounts = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Discount.find({ schoolId: req.user!.schoolId }).populate({ path: "studentId", populate: { path: "userId" } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateDiscountStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ message: "Invalid status" });

    const discount = await Discount.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status, approvedBy: req.user!.userId, isActive: status === "APPROVED" },
      { new: true }
    );
    if (!discount) return res.status(404).json({ message: "Discount not found" });

    // Blueprint explicitly requires discount/scholarship approvals to be
    // audited - this reduces a family's fee, so who approved it and when
    // needs to be traceable the same way refunds already are.
    const actingUser = await User.findById(req.user!.userId).select("name");
    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: actingUser?.name || "Unknown",
      userRole: req.user!.role,
      action: `Discount ${status.toLowerCase()}`,
      recordType: "Discount",
      recordId: discount._id.toString(),
      newValue: { status, percentage: discount.percentage, fixedAmount: discount.fixedAmount },
    });

    res.json(discount);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createRefund = async (req: AuthRequest, res: Response) => {
  try {
    // The invoice-adjustment logic (deducting the refunded amount) only
    // runs inside updateRefundStatus when a refund transitions to APPROVED
    // - if a caller could set status: "APPROVED" here at creation time, the
    // refund would be recorded as approved while the invoice was never
    // actually adjusted, silently desyncing the fee ledger from its status.
    const { status, approvedBy, requestedByUserId, ...safeBody } = req.body;
    const refund = await Refund.create({ ...safeBody, schoolId: req.user!.schoolId, requestedByUserId: req.user!.userId });
    res.status(201).json(refund);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getRefunds = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Refund.find({ schoolId: req.user!.schoolId }).populate({ path: "studentId", populate: { path: "userId" } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateRefundStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existing = await Refund.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!existing) return res.status(404).json({ message: "Refund not found" });

    // Blueprint 98: separation of duties - whoever requested this refund
    // shouldn't be the one deciding whether it gets paid out.
    if (existing.requestedByUserId && existing.requestedByUserId.toString() === req.user!.userId) {
      return res.status(403).json({ message: "You cannot approve a refund you requested yourself. Ask another admin to review it." });
    }

    // A refund's financial effect (reducing the invoice's paid amount) must
    // only ever be applied once. Without this guard, an accountant
    // double-clicking Approve - or the request simply being retried after a
    // slow network response - would deduct refund.amount from the invoice a
    // second time, silently corrupting the student's fee ledger.
    if (existing.status === "APPROVED" || existing.status === "REJECTED") {
      return res.status(400).json({ message: `This refund has already been ${existing.status.toLowerCase()} and cannot be changed again.` });
    }

    const previousStatus = existing.status;
    existing.status = status;
    await existing.save();

    if (status === "APPROVED" && existing.invoiceId) {
      const invoice = await Invoice.findOne({ _id: existing.invoiceId, schoolId: req.user!.schoolId });
      if (invoice) {
        invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - existing.amount);
        invoice.status = invoice.paidAmount >= invoice.amount ? "PAID" : invoice.paidAmount > 0 ? "PARTIAL" : "PENDING";
        await invoice.save();
      }
    }

    const actingUser = await User.findById(req.user!.userId).select("name");
    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: actingUser?.name || "Unknown",
      userRole: req.user!.role,
      action: `Refund ${status.toLowerCase()}`,
      recordType: "Refund",
      recordId: existing._id.toString(),
      oldValue: { status: previousStatus },
      newValue: { status, amount: existing.amount },
    });

    res.json(existing);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Expense.find({ schoolId: req.user!.schoolId }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const invoices = await Invoice.find({ schoolId });
    const expenses = await Expense.find({ schoolId });

    const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
    const totalCollected = activeInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalPending = activeInvoices.reduce((sum, i) => sum + (i.amount - (i.paidAmount || 0)), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Blueprint's Accounting module calls for "account categories" and a
    // real ledger view, not just four flat totals - break both income and
    // expenses down by category so a principal can see where money is
    // actually coming from and going to.
    const expenseByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    }

    const incomeByFeeType: Record<string, number> = {};
    for (const i of activeInvoices) {
      incomeByFeeType[i.feeType] = (incomeByFeeType[i.feeType] || 0) + (i.paidAmount || 0);
    }

    // Last 6 months of income vs expense, so the trend is visible without
    // needing a separate reports screen.
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const monthly: Record<string, { income: number; expense: number }> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      monthly[monthKey(d)] = { income: 0, expense: 0 };
    }
    for (const inv of activeInvoices) {
      const key = monthKey(new Date(inv.paidDate || inv.createdAt));
      if (monthly[key] && inv.paidAmount) monthly[key].income += inv.paidAmount;
    }
    for (const e of expenses) {
      const key = monthKey(new Date(e.date));
      if (monthly[key]) monthly[key].expense += e.amount;
    }
    const monthlyTrend = Object.entries(monthly).map(([month, v]) => ({ month, ...v }));

    res.json({
      totalCollected,
      totalPending,
      totalExpenses,
      netIncome: totalCollected - totalExpenses,
      expenseByCategory,
      incomeByFeeType,
      monthlyTrend,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
