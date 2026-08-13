import type { Request, Response } from "express";
import HostelBuilding from "../models/HostelBuilding";
import HostelRoom from "../models/HostelRoom";
import HostelAllocation from "../models/HostelAllocation";

// Buildings
export const createBuilding = async (req: Request, res: Response) => {
  try {
    const building = await HostelBuilding.create(req.body);
    res.status(201).json(building);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getBuildings = async (req: Request, res: Response) => {
  try {
    const list = await HostelBuilding.find({ schoolId: req.query.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Rooms
export const createRoom = async (req: Request, res: Response) => {
  try {
    const room = await HostelRoom.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const list = await HostelRoom.find({ buildingId: req.query.buildingId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Allocation
export const allocateRoom = async (req: Request, res: Response) => {
  try {
    const room = await HostelRoom.findById(req.body.roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.occupied >= room.capacity) return res.status(400).json({ message: "Room is full" });

    const allocation = await HostelAllocation.create(req.body);
    room.occupied += 1;
    await room.save();

    res.status(201).json(allocation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAllocations = async (req: Request, res: Response) => {
  try {
    const list = await HostelAllocation.find({ schoolId: req.query.schoolId, isActive: true }).populate({ path: "studentId", populate: { path: "userId" } }).populate("roomId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
