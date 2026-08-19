import { Router } from "express";
import {
  createDiscount, getDiscounts, updateDiscountStatus,
  createRefund, getRefunds, updateRefundStatus,
  createExpense, getExpenses, getFinancialSummary,
} from "../controllers/financeController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { FINANCE_STAFF, TOP_ADMIN } from "../middleware/permissions";

const router = Router();

router.post("/discounts", protect, requireRole(...FINANCE_STAFF), createDiscount);
router.get("/discounts", protect, requireRole(...FINANCE_STAFF), getDiscounts);
router.put("/discounts/:id/status", protect, requireRole(...TOP_ADMIN), updateDiscountStatus);

router.post("/refunds", protect, requireRole(...FINANCE_STAFF), createRefund);
router.get("/refunds", protect, requireRole(...FINANCE_STAFF), getRefunds);
router.put("/refunds/:id/status", protect, requireRole(...FINANCE_STAFF), updateRefundStatus);

router.post("/expenses", protect, requireRole(...FINANCE_STAFF), createExpense);
router.get("/expenses", protect, requireRole(...FINANCE_STAFF), getExpenses);

router.get("/summary", protect, requireRole(...FINANCE_STAFF), getFinancialSummary);

export default router;
