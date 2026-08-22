import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import HostelBuilding from "../models/HostelBuilding";
import HostelRoom from "../models/HostelRoom";
import HostelAllocation from "../models/HostelAllocation";

// Buildings
export const createBuilding = async (req: AuthRequest, res: Response) => {
  try {
    const building = await HostelBuilding.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(building);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getBuildings = async (req: AuthRequest, res: Response) => {
  try {
    const list = await HostelBuilding.find({ schoolId: req.user!.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Rooms
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const building = await HostelBuilding.findOne({ _id: req.body.buildingId, schoolId: req.user!.schoolId });
    if (!building) return res.status(404).json({ message: "Building not found" });
    const room = await HostelRoom.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    const list = await HostelRoom.find({ schoolId: req.user!.schoolId, buildingId: req.query.buildingId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Allocation
export const allocateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await HostelRoom.findOne({ _id: req.body.roomId, schoolId: req.user!.schoolId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.occupied >= room.capacity) return res.status(400).json({ message: "Room is full" });

    const existingActive = await HostelAllocation.findOne({
      schoolId: req.user!.schoolId,
      studentId: req.body.studentId,
      isActive: true,
    });
    if (existingActive) {
      return res.status(400).json({ message: "This student already has an active hostel allocation. Deallocate it first before assigning a new room." });
    }

    const allocation = await HostelAllocation.create({ ...req.body, schoolId: req.user!.schoolId });
    room.occupied += 1;
    await room.save();

    res.status(201).json(allocation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAllocations = async (req: AuthRequest, res: Response) => {
  try {
    const list = await HostelAllocation.find({ schoolId: req.user!.schoolId, isActive: true }).populate({ path: "studentId", populate: { path: "userId" } }).populate("roomId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
