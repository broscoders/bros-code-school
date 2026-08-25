import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Discount from "../models/Discount";
import Refund from "../models/Refund";
import Invoice from "../models/Invoice";
import Expense from "../models/Expense";

export const createDiscount = async (req: AuthRequest, res: Response) => {
  try {
    const discount = await Discount.create({ ...req.body, schoolId: req.user!.schoolId });
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
    res.json(discount);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createRefund = async (req: AuthRequest, res: Response) => {
  try {
    const refund = await Refund.create({ ...req.body, schoolId: req.user!.schoolId });
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
    const refund = await Refund.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status: req.body.status },
      { new: true }
    );
    if (!refund) return res.status(404).json({ message: "Refund not found" });

    if (req.body.status === "APPROVED" && refund.invoiceId) {
      const invoice = await Invoice.findOne({ _id: refund.invoiceId, schoolId: req.user!.schoolId });
      if (invoice) {
        invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - refund.amount);
        invoice.status = invoice.paidAmount >= invoice.amount ? "PAID" : invoice.paidAmount > 0 ? "PARTIAL" : "PENDING";
        await invoice.save();
      }
    }

    res.json(refund);
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
