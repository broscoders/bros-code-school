import type { Request, Response } from "express";
import Discount from "../models/Discount";
import Refund from "../models/Refund";
import Expense from "../models/Expense";
import Invoice from "../models/Invoice";

// Discounts / Scholarships
export const createDiscount = async (req: Request, res: Response) => {
  try {
    const discount = await Discount.create(req.body);
    res.status(201).json(discount);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getDiscounts = async (req: Request, res: Response) => {
  try {
    const list = await Discount.find({ schoolId: req.query.schoolId }).populate({ path: "studentId", populate: { path: "userId" } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Refunds
export const createRefund = async (req: Request, res: Response) => {
  try {
    const refund = await Refund.create(req.body);
    res.status(201).json(refund);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getRefunds = async (req: Request, res: Response) => {
  try {
    const list = await Refund.find({ schoolId: req.query.schoolId }).populate({ path: "studentId", populate: { path: "userId" } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateRefundStatus = async (req: Request, res: Response) => {
  try {
    const refund = await Refund.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!refund) return res.status(404).json({ message: "Refund not found" });
    res.json(refund);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Expenses / Accounting
export const createExpense = async (req: Request, res: Response) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const list = await Expense.find({ schoolId: req.query.schoolId }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.query;
    const invoices = await Invoice.find({ schoolId });
    const expenses = await Expense.find({ schoolId });

    const totalCollected = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + (i.paidAmount || i.amount), 0);
    const totalPending = invoices.filter((i) => i.status !== "PAID").reduce((sum, i) => sum + i.amount, 0);
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
