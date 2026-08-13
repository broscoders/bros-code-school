import { Router } from "express";
import {
  createItem, getItems, stockMovement,
  createAsset, getAssets, updateAssetCondition,
  createVendor, getVendors,
  createTicket, getTickets, updateTicket,
} from "../controllers/assetsController";

const router = Router();

router.post("/items", createItem);
router.get("/items", getItems);
router.post("/items/stock", stockMovement);

router.post("/assets", createAsset);
router.get("/assets", getAssets);
router.put("/assets/:id/condition", updateAssetCondition);

router.post("/vendors", createVendor);
router.get("/vendors", getVendors);

router.post("/tickets", createTicket);
router.get("/tickets", getTickets);
router.put("/tickets/:id", updateTicket);

export default router;
