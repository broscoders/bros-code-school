import { Router } from "express";
import { createItem, getItems, toggleItemAvailability, placeOrder, getMyOrders, getAllOrders, updateOrderStatus } from "../controllers/canteenController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ANY_ADMIN_STAFF, EVERYONE, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/items", protect, requireRole(...ANY_ADMIN_STAFF), createItem);
router.get("/items", protect, requireRole(...EVERYONE), getItems);
router.put("/items/:id/toggle", protect, requireRole(...ANY_ADMIN_STAFF), toggleItemAvailability);

router.post("/orders", protect, requireRole(ROLES.PARENT, ROLES.STUDENT), placeOrder);
router.get("/orders/mine", protect, requireRole(...EVERYONE), getMyOrders);
router.get("/orders", protect, requireRole(...ANY_ADMIN_STAFF), getAllOrders);
router.put("/orders/:id/status", protect, requireRole(...ANY_ADMIN_STAFF), updateOrderStatus);

export default router;
