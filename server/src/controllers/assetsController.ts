import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import InventoryItem from "../models/InventoryItem";
import Asset from "../models/Asset";
import Vendor from "../models/Vendor";
import MaintenanceTicket from "../models/MaintenanceTicket";
import PurchaseOrder from "../models/PurchaseOrder";

export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const item = await InventoryItem.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const items = await InventoryItem.find({ schoolId: req.user!.schoolId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getLowStockItems = async (req: AuthRequest, res: Response) => {
  try {
    const items = await InventoryItem.find({ schoolId: req.user!.schoolId });
    const lowStock = items.filter((i) => i.quantity <= i.lowStockThreshold);
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const stockMovement = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, change } = req.body;
    const item = await InventoryItem.findOneAndUpdate(
      { _id: itemId, schoolId: req.user!.schoolId },
      { $inc: { quantity: change } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createAsset = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAssets = async (req: AuthRequest, res: Response) => {
  try {
    const assets = await Asset.find({ schoolId: req.user!.schoolId });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateAssetCondition = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { condition: req.body.condition },
      { new: true }
    );
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createVendor = async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await Vendor.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getVendors = async (req: AuthRequest, res: Response) => {
  try {
    const vendors = await Vendor.find({ schoolId: req.user!.schoolId });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await MaintenanceTicket.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await MaintenanceTicket.find({ schoolId: req.user!.schoolId }).populate("reportedBy").sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await MaintenanceTicket.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      req.body,
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const totalEstimatedCost = (req.body.items || []).reduce((sum: number, i: any) => sum + i.quantity * i.estimatedCost, 0);
    const po = await PurchaseOrder.create({
      ...req.body,
      schoolId: req.user!.schoolId,
      requestedBy: req.user!.userId,
      totalEstimatedCost,
    });
    res.status(201).json(po);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response) => {
  try {
    const list = await PurchaseOrder.find({ schoolId: req.user!.schoolId }).populate("vendorId requestedBy").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updatePurchaseOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const valid = ["APPROVED", "REJECTED", "ORDERED", "RECEIVED"];
    if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const po = await PurchaseOrder.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!po) return res.status(404).json({ message: "Purchase order not found" });

    po.status = status;
    if (status === "APPROVED") po.approvedBy = req.user!.userId as any;
    if (status === "RECEIVED") {
      po.receivedDate = new Date();
      for (const item of po.items) {
        const existing = await InventoryItem.findOne({ schoolId: req.user!.schoolId, name: item.itemName });
        if (existing) {
          existing.quantity += item.quantity;
          await existing.save();
        } else {
          await InventoryItem.create({
            schoolId: req.user!.schoolId,
            name: item.itemName,
            category: "Procured",
            quantity: item.quantity,
            lowStockThreshold: 5,
            unit: "pcs",
          });
        }
      }
    }
    await po.save();

    res.json(po);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
