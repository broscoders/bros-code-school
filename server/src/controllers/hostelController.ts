import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import HostelBuilding from "../models/HostelBuilding";
import HostelRoom from "../models/HostelRoom";
import HostelAllocation from "../models/HostelAllocation";
import Student from "../models/Student";

// Buildings
export const createBuilding = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Building name is required" });
    if (!["BOYS", "GIRLS"].includes(req.body.type)) return res.status(400).json({ message: "Building type must be BOYS or GIRLS" });
    if (await HostelBuilding.exists({ schoolId, name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })) {
      return res.status(409).json({ message: `A building named "${name}" already exists` });
    }
    const building = await HostelBuilding.create({ schoolId, name, type: req.body.type, wardenName: req.body.wardenName ? String(req.body.wardenName).trim() : undefined });
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
    const schoolId = req.user!.schoolId;
    const building = await HostelBuilding.findOne({ _id: req.body.buildingId, schoolId });
    if (!building) return res.status(404).json({ message: "Building not found" });
    const roomNumber = String(req.body.roomNumber || "").trim();
    const capacity = Number(req.body.capacity);
    if (!roomNumber) return res.status(400).json({ message: "Room number is required" });
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) return res.status(400).json({ message: "Capacity must be a whole number between 1 and 50" });
    if (await HostelRoom.exists({ schoolId, buildingId: building._id, roomNumber })) {
      return res.status(409).json({ message: `Room ${roomNumber} already exists in ${building.name}` });
    }
    // occupied always starts at 0 (the client could previously send any value)
    const room = await HostelRoom.create({ schoolId, buildingId: building._id, roomNumber, capacity });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { schoolId: req.user!.schoolId };
    if (req.query.buildingId) filter.buildingId = req.query.buildingId as string;
    const list = await HostelRoom.find(filter).sort({ roomNumber: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Allocation
export const allocateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ _id: req.body.studentId, schoolId: req.user!.schoolId, status: "ACTIVE" });
    if (!student) return res.status(404).json({ message: "Active student not found in your school" });
    const monthlyFee = req.body.monthlyFee === undefined || req.body.monthlyFee === "" ? 0 : Number(req.body.monthlyFee);
    if (!Number.isFinite(monthlyFee) || monthlyFee < 0) return res.status(400).json({ message: "Monthly fee must be zero or more" });

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

    try {
      const allocation = await HostelAllocation.create({
        schoolId: req.user!.schoolId,
        studentId: req.body.studentId,
        roomId: req.body.roomId,
        isActive: true,
        monthlyFee,
      });
      res.status(201).json(allocation);
    } catch (createErr) {
      // the bed was already reserved above - give it back so it isn't lost
      await HostelRoom.findByIdAndUpdate(req.body.roomId, { $inc: { occupied: -1 } });
      throw createErr;
    }
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
    // atomic: two quick clicks can't both free the same bed (the old
    // read-then-save version could decrement the room twice)
    const allocation = await HostelAllocation.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!allocation) return res.status(404).json({ message: "Allocation not found or already inactive" });

    await HostelRoom.findOneAndUpdate(
      { _id: allocation.roomId, schoolId: req.user!.schoolId, $expr: { $gt: ["$occupied", 0] } },
      { $inc: { occupied: -1 } }
    );

    res.json(allocation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
