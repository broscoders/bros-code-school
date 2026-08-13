import type { Request, Response } from "express";
import InventoryItem from "../models/InventoryItem";
import Asset from "../models/Asset";
import Vendor from "../models/Vendor";
import MaintenanceTicket from "../models/MaintenanceTicket";

// Inventory
export const createItem = async (req: Request, res: Response) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await InventoryItem.find({ schoolId: req.query.schoolId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const stockMovement = async (req: Request, res: Response) => {
  try {
    const { itemId, change } = req.body;
    const item = await InventoryItem.findByIdAndUpdate(itemId, { $inc: { quantity: change } }, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Assets
export const createAsset = async (req: Request, res: Response) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await Asset.find({ schoolId: req.query.schoolId });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateAssetCondition = async (req: Request, res: Response) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, { condition: req.body.condition }, { new: true });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Vendors
export const createVendor = async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await Vendor.find({ schoolId: req.query.schoolId });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Maintenance
export const createTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await MaintenanceTicket.create(req.body);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await MaintenanceTicket.find({ schoolId: req.query.schoolId }).populate("reportedBy").sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
