import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import CanteenItem from "../models/CanteenItem";
import CanteenOrder from "../models/CanteenOrder";
import { canAccessStudent } from "../utils/accessControl";

export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const item = await CanteenItem.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const items = await CanteenItem.find({ schoolId: req.user!.schoolId, isAvailable: true });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const toggleItemAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const item = await CanteenItem.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!item) return res.status(404).json({ message: "Item not found" });
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Reachable by PARENT/STUDENT to place an order for a specific student -
// same ownership check as academy enrollment/store purchases, so a parent
// can't order (and bill) against a student who isn't their own child.
export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, items } = req.body as { studentId: string; items: { itemId: string; quantity: number }[] };
    const allowed = await canAccessStudent(req, studentId);
    if (!allowed) return res.status(403).json({ message: "You do not have access to order for this student" });

    if (!items || items.length === 0) return res.status(400).json({ message: "Order must contain at least one item" });

    const orderLines = [];
    let totalAmount = 0;
    for (const line of items) {
      const item = await CanteenItem.findOne({ _id: line.itemId, schoolId: req.user!.schoolId, isAvailable: true });
      if (!item) return res.status(400).json({ message: `Item not available` });
      const quantity = Math.max(1, Number(line.quantity) || 1);
      orderLines.push({ itemId: item._id, itemName: item.name, price: item.price, quantity });
      totalAmount += item.price * quantity;
    }

    const order = await CanteenOrder.create({
      schoolId: req.user!.schoolId,
      studentId,
      items: orderLines,
      totalAmount,
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.query.studentId as string;
    const allowed = await canAccessStudent(req, studentId);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student's orders" });

    const orders = await CanteenOrder.find({ schoolId: req.user!.schoolId, studentId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Staff-facing: every order for the school (kitchen/canteen counter view).
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await CanteenOrder.find({ schoolId: req.user!.schoolId, status: { $ne: "CANCELLED" } })
      .populate({ path: "studentId", populate: { path: "userId" } })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["PREPARING", "READY", "COLLECTED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await CanteenOrder.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
