import { Router } from "express";
import {
  createDiscount, getDiscounts, updateDiscountStatus,
  createRefund, getRefunds, updateRefundStatus,
  createExpense, getExpenses, getFinancialSummary,
  initiateJazzCashPayment, getJazzCashTransactionStatus,
} from "../controllers/financeController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { FINANCE_STAFF, TOP_ADMIN, EVERYONE } from "../middleware/permissions";
import { emailActionLimiter } from "../middleware/rateLimiters";

const router = Router();

router.post("/discounts", protect, requireRole(...FINANCE_STAFF), createDiscount);
router.get("/discounts", protect, requireRole(...FINANCE_STAFF), getDiscounts);
router.put("/discounts/:id/status", protect, requireRole(...TOP_ADMIN), updateDiscountStatus);

router.post("/refunds", protect, requireRole(...FINANCE_STAFF), createRefund);
router.get("/refunds", protect, requireRole(...FINANCE_STAFF), getRefunds);
router.put("/refunds/:id/status", protect, requireRole(...TOP_ADMIN), updateRefundStatus);

router.post("/expenses", protect, requireRole(...FINANCE_STAFF), createExpense);
router.get("/expenses", protect, requireRole(...FINANCE_STAFF), getExpenses);

router.get("/summary", protect, requireRole(...FINANCE_STAFF), getFinancialSummary);

// Online payment - unlike everything else in this file, this one is
// intentionally open to whoever can already view the invoice (parent or
// staff), not staff-only - see the comment on initiateJazzCashPayment for
// why that's safe here specifically.
router.post("/jazzcash/invoices/:id/initiate", protect, requireRole(...EVERYONE), emailActionLimiter, initiateJazzCashPayment);
router.get("/jazzcash/transactions/:txnRefNo", protect, requireRole(...EVERYONE), getJazzCashTransactionStatus);

export default router;
