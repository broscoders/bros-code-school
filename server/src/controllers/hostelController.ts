import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import HostelBuilding from "../models/HostelBuilding";
import HostelRoom from "../models/HostelRoom";
import HostelAllocation from "../models/HostelAllocation";
import Student from "../models/Student";

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
    const student = await Student.findOne({ _id: req.body.studentId, schoolId: req.user!.schoolId });
    if (!student) return res.status(404).json({ message: "Student not found in your school" });

    const existingActive = await HostelAllocation.findOne({
      schoolId: req.user!.schoolId,
      studentId: req.body.studentId,
      isActive: true,
    });
    if (existingActive) {
      return res.status(400).json({ message: "This student already has an active hostel allocation. Deallocate it first before assigning a new room." });
    }

    // Atomically reserve the bed: the capacity check and the increment
    // happen as a single database operation. The previous version read
    // room.occupied, checked it in application code, then saved a separate
    // increment afterwards - if two allocation requests for the same room
    // landed close together, both could read the same "still has space"
    // value before either write landed, over-filling the room beyond its
    // physical capacity.
    const room = await HostelRoom.findOneAndUpdate(
      {
        _id: req.body.roomId,
        schoolId: req.user!.schoolId,
        $expr: { $lt: ["$occupied", "$capacity"] },
      },
      { $inc: { occupied: 1 } },
      { new: true }
    );
    if (!room) {
      return res.status(400).json({ message: "Room is full or not found" });
    }

    const allocation = await HostelAllocation.create({
      schoolId: req.user!.schoolId,
      studentId: req.body.studentId,
      roomId: req.body.roomId,
      isActive: true,
      ...(req.body.monthlyFee !== undefined ? { monthlyFee: req.body.monthlyFee } : {}),
    });

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

// Frees a bed. This did not exist before even though allocateRoom's own
// error message told admins to "deallocate it first" - without it, a bed
// occupied by a student who graduates, withdraws, or transfers stays marked
// occupied forever, and the room can never be reused.
export const deallocateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const allocation = await HostelAllocation.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!allocation) return res.status(404).json({ message: "Allocation not found" });
    if (!allocation.isActive) return res.status(400).json({ message: "This allocation is already inactive" });

    allocation.isActive = false;
    await allocation.save();

    await HostelRoom.findOneAndUpdate(
      { _id: allocation.roomId, schoolId: req.user!.schoolId, $expr: { $gt: ["$occupied", 0] } },
      { $inc: { occupied: -1 } }
    );

    res.json(allocation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
