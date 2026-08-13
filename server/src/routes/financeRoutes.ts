import { Router } from "express";
import {
  createDiscount, getDiscounts,
  createRefund, getRefunds, updateRefundStatus,
  createExpense, getExpenses, getFinancialSummary,
} from "../controllers/financeController";

const router = Router();

router.post("/discounts", createDiscount);
router.get("/discounts", getDiscounts);

router.post("/refunds", createRefund);
router.get("/refunds", getRefunds);
router.put("/refunds/:id/status", updateRefundStatus);

router.post("/expenses", createExpense);
router.get("/expenses", getExpenses);

router.get("/summary", getFinancialSummary);

export default router;
