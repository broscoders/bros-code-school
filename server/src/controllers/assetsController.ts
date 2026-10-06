import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import InventoryItem from "../models/InventoryItem";
import Asset from "../models/Asset";
import Vendor from "../models/Vendor";
import MaintenanceTicket from "../models/MaintenanceTicket";
import PurchaseOrder from "../models/PurchaseOrder";

const trim = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());

export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const name = trim(req.body.name);
    const category = trim(req.body.category);
    const quantity = req.body.quantity === undefined || req.body.quantity === "" ? 0 : Number(req.body.quantity);
    const threshold = req.body.lowStockThreshold === undefined || req.body.lowStockThreshold === "" ? 5 : Number(req.body.lowStockThreshold);
    if (!name || !category) return res.status(400).json({ message: "Item name and category are required" });
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ message: "Quantity must be a whole number of 0 or more" });
    if (!Number.isInteger(threshold) || threshold < 0) return res.status(400).json({ message: "Low-stock level must be a whole number of 0 or more" });
    const item = await InventoryItem.create({
      schoolId: req.user!.schoolId, name, category, quantity, lowStockThreshold: threshold,
      warehouse: trim(req.body.warehouse) || undefined, unit: trim(req.body.unit) || "pcs",
    });
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
    const { itemId } = req.body;
    const change = Number(req.body.change);
    // `change` used to go straight into $inc: text or decimals corrupted the
    // quantity, and stock could be taken out below zero.
    if (!Number.isInteger(change) || change === 0) return res.status(400).json({ message: "Change must be a whole number (use a minus sign to remove stock)" });
    const filter: Record<string, any> = { _id: itemId, schoolId: req.user!.schoolId };
    if (change < 0) filter.quantity = { $gte: -change };
    const item = await InventoryItem.findOneAndUpdate(filter, { $inc: { quantity: change } }, { new: true });
    if (!item) {
      const exists = await InventoryItem.exists({ _id: itemId, schoolId: req.user!.schoolId });
      return res.status(exists ? 400 : 404).json({ message: exists ? "Not enough stock to remove that many" : "Item not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createAsset = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const name = trim(req.body.name);
    const category = trim(req.body.category);
    const assetTag = trim(req.body.assetTag);
    if (!name || !category || !assetTag) return res.status(400).json({ message: "Name, category and asset tag are required" });
    if (req.body.condition && !["GOOD", "FAIR", "NEEDS_REPAIR", "DAMAGED"].includes(req.body.condition)) return res.status(400).json({ message: "Invalid condition" });
    // assetTag is unique across the whole system, so a clash can come from
    // another school too - say so plainly instead of a raw "E11000" 500 error
    if (await Asset.exists({ assetTag })) return res.status(409).json({ message: `Asset tag "${assetTag}" is already in use. Please choose a different tag.` });
    const asset = await Asset.create({
      schoolId, name, category, assetTag,
      location: trim(req.body.location) || undefined,
      assignedTo: trim(req.body.assignedTo) || undefined,
      purchaseDate: req.body.purchaseDate || undefined,
      warrantyExpiry: req.body.warrantyExpiry || undefined,
      condition: req.body.condition || "GOOD",
    });
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
    if (!["GOOD", "FAIR", "NEEDS_REPAIR", "DAMAGED"].includes(req.body.condition)) return res.status(400).json({ message: "Invalid condition" });
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
    const name = trim(req.body.name);
    const contact = trim(req.body.contact);
    if (!name || !contact) return res.status(400).json({ message: "Vendor name and contact are required" });
    const vendor = await Vendor.create({ schoolId: req.user!.schoolId, name, contact, category: trim(req.body.category) || undefined });
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
    const title = trim(req.body.title);
    const description = trim(req.body.description);
    if (!title || !description) return res.status(400).json({ message: "Title and description are required" });
    if (req.body.priority && !["LOW", "MEDIUM", "HIGH"].includes(req.body.priority)) return res.status(400).json({ message: "Invalid priority" });
    // Any staff/teacher can report an issue, but reportedBy is the logged-in
    // user (it used to come from the browser) and status/assignee/cost are
    // set later by admin staff only.
    const ticket = await MaintenanceTicket.create({
      schoolId: req.user!.schoolId, reportedBy: req.user!.userId, title, description,
      priority: req.body.priority || "MEDIUM",
    });
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
    // Only these fields can change. The whole body used to be applied, which
    // allowed rewriting schoolId or reportedBy of an existing ticket.
    const update: Record<string, unknown> = {};
    if (req.body.status !== undefined) {
      if (!["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
      update.status = req.body.status;
    }
    if (req.body.priority !== undefined) {
      if (!["LOW", "MEDIUM", "HIGH"].includes(req.body.priority)) return res.status(400).json({ message: "Invalid priority" });
      update.priority = req.body.priority;
    }
    if (req.body.assignedTo !== undefined) update.assignedTo = trim(req.body.assignedTo);
    if (req.body.resolutionNotes !== undefined) update.resolutionNotes = trim(req.body.resolutionNotes);
    if (req.body.cost !== undefined && req.body.cost !== "") {
      const cost = Number(req.body.cost);
      if (!Number.isFinite(cost) || cost < 0) return res.status(400).json({ message: "Cost must be zero or more" });
      update.cost = cost;
    }
    if (Object.keys(update).length === 0) return res.status(400).json({ message: "Nothing to update" });
    const ticket = await MaintenanceTicket.findOneAndUpdate({ _id: req.params.id, schoolId: req.user!.schoolId }, update, { new: true });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (rawItems.length === 0) return res.status(400).json({ message: "Add at least one item" });
    // quantities/costs come as text; with the old code a text value made the
    // total NaN and the order could be saved with no total at all
    const items = rawItems.map((i: any) => ({ itemName: trim(i.itemName), quantity: Number(i.quantity), estimatedCost: Number(i.estimatedCost) }));
    if (items.some((i: any) => !i.itemName || !Number.isInteger(i.quantity) || i.quantity < 1 || !Number.isFinite(i.estimatedCost) || i.estimatedCost < 0)) {
      return res.status(400).json({ message: "Each item needs a name, a whole quantity of 1 or more and a cost of 0 or more" });
    }
    if (req.body.vendorId && !(await Vendor.exists({ _id: req.body.vendorId, schoolId }))) return res.status(404).json({ message: "Vendor not found" });
    const totalEstimatedCost = items.reduce((sum: number, i: any) => sum + i.quantity * i.estimatedCost, 0);
    const po = await PurchaseOrder.create({
      schoolId, vendorId: req.body.vendorId || undefined, items,
      requestedBy: req.user!.userId, totalEstimatedCost,
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

    // A purchase order moves forward only: REQUESTED -> APPROVED/REJECTED,
    // APPROVED -> ORDERED -> RECEIVED. It used to be possible to receive a
    // REJECTED (or never-approved) order straight into stock.
    const allowedNext: Record<string, string[]> = {
      REQUESTED: ["APPROVED", "REJECTED"],
      APPROVED: ["ORDERED", "RECEIVED"],
      ORDERED: ["RECEIVED"],
      REJECTED: [],
      RECEIVED: [],
    };
    if (!(allowedNext[po.status] || []).includes(status)) {
      return res.status(400).json({ message: `A ${po.status.toLowerCase()} order cannot be changed to ${status.toLowerCase()}.` });
    }
    // whoever requested the purchase can't approve it themselves
    if (status === "APPROVED" && po.requestedBy?.toString() === req.user!.userId) {
      return res.status(403).json({ message: "You cannot approve a purchase you requested yourself. Ask another admin." });
    }

    // Receiving stock into inventory must only ever happen once per order -
    // without this guard, marking an already-RECEIVED order as RECEIVED
    // again (double-click, retry) would add the same items to inventory a
    // second time, inflating stock counts that were never actually
    // delivered twice.
    if (status === "RECEIVED" && po.status === "RECEIVED") {
      return res.status(400).json({ message: "This purchase order has already been marked as received." });
    }

    po.status = status;
    if (status === "APPROVED") po.approvedBy = req.user!.userId as any;
    if (status === "RECEIVED") {
      po.receivedDate = new Date();
      for (const item of po.items) {
        // Atomic increment, same reasoning as the hostel/library fixes -
        // avoids a lost-update race if two orders affecting the same
        // inventory item are received close together.
        const updated = await InventoryItem.findOneAndUpdate(
          { schoolId: req.user!.schoolId, name: item.itemName },
          { $inc: { quantity: item.quantity } },
          { new: true }
        );
        if (!updated) {
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
