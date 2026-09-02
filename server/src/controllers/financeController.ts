import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Discount from "../models/Discount";
import Refund from "../models/Refund";
import Invoice from "../models/Invoice";
import Expense from "../models/Expense";
import User from "../models/User";
import { logAudit } from "../utils/auditLogger";

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
    const { status, approvedBy, ...safeBody } = req.body;
    const refund = await Refund.create({ ...safeBody, schoolId: req.user!.schoolId });
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

    res.json({
      totalCollected,
      totalPending,
      totalExpenses,
      netIncome: totalCollected - totalExpenses,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
