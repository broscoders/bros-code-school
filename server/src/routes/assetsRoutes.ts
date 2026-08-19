import { Router } from "express";
import {
  createItem, getItems, getLowStockItems, stockMovement,
  createAsset, getAssets, updateAssetCondition,
  createVendor, getVendors,
  createTicket, getTickets, updateTicket,
  createPurchaseOrder, getPurchaseOrders, updatePurchaseOrderStatus,
} from "../controllers/assetsController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ANY_ADMIN_STAFF, ALL_STAFF_AND_TEACHERS, TOP_ADMIN } from "../middleware/permissions";

const router = Router();

router.post("/items", protect, requireRole(...ANY_ADMIN_STAFF), createItem);
router.get("/items", protect, requireRole(...ANY_ADMIN_STAFF), getItems);
router.get("/items/low-stock", protect, requireRole(...ANY_ADMIN_STAFF), getLowStockItems);
router.post("/items/stock", protect, requireRole(...ANY_ADMIN_STAFF), stockMovement);

router.post("/assets", protect, requireRole(...ANY_ADMIN_STAFF), createAsset);
router.get("/assets", protect, requireRole(...ANY_ADMIN_STAFF), getAssets);
router.put("/assets/:id/condition", protect, requireRole(...ANY_ADMIN_STAFF), updateAssetCondition);

router.post("/vendors", protect, requireRole(...ANY_ADMIN_STAFF), createVendor);
router.get("/vendors", protect, requireRole(...ANY_ADMIN_STAFF), getVendors);

router.post("/tickets", protect, requireRole(...ALL_STAFF_AND_TEACHERS), createTicket);
router.get("/tickets", protect, requireRole(...ANY_ADMIN_STAFF), getTickets);
router.put("/tickets/:id", protect, requireRole(...ANY_ADMIN_STAFF), updateTicket);

router.post("/purchase-orders", protect, requireRole(...ANY_ADMIN_STAFF), createPurchaseOrder);
router.get("/purchase-orders", protect, requireRole(...ANY_ADMIN_STAFF), getPurchaseOrders);
router.put("/purchase-orders/:id/status", protect, requireRole(...TOP_ADMIN), updatePurchaseOrderStatus);

export default router;
