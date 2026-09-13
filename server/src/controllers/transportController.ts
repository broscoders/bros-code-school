import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Vehicle from "../models/Vehicle";
import TransportAssignment from "../models/TransportAssignment";
import Student from "../models/Student";

export const addVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await Vehicle.find({ schoolId: req.user!.schoolId });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateVehicleStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["ACTIVE", "MAINTENANCE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const assignStudentToVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId, vehicleId, monthlyFee } = req.body;

    const student = await Student.findOne({ _id: studentId, schoolId });
    if (!student) return res.status(404).json({ message: "Student not found in your school" });

    const existing = await TransportAssignment.findOne({ schoolId, studentId, isActive: true });
    if (existing) {
      return res.status(400).json({ message: "This student is already assigned to a transport route. Remove the existing assignment first." });
    }

    // Atomic reserve, same pattern as HostelRoom/LibraryBook: capacity
    // check and the increment happen as a single database operation so two
    // simultaneous assignments can't both see "still has room" and
    // over-fill the vehicle past its physical seating.
    //
    // $ifNull covers vehicles created before capacity/occupied/status
    // existed on this model - their stored documents genuinely don't have
    // these fields yet (Mongoose's schema default only applies once the
    // doc is next saved), so a literal { status: "ACTIVE" } or bare
    // $occupied/$capacity comparison would silently fail to match them.
    const vehicle = await Vehicle.findOneAndUpdate(
      {
        _id: vehicleId,
        schoolId,
        $expr: {
          $and: [
            { $ne: [{ $ifNull: ["$status", "ACTIVE"] }, "INACTIVE"] },
            { $ne: [{ $ifNull: ["$status", "ACTIVE"] }, "MAINTENANCE"] },
            { $lt: [{ $ifNull: ["$occupied", 0] }, { $ifNull: ["$capacity", 40] }] },
          ],
        },
      },
      { $inc: { occupied: 1 } },
      { new: true }
    );
    if (!vehicle) {
      return res.status(400).json({ message: "Vehicle not found, not active, or already at full capacity" });
    }

    const assignment = await TransportAssignment.create({ schoolId, studentId, vehicleId, monthlyFee });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTransportAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const list = await TransportAssignment.find({ schoolId: req.user!.schoolId, isActive: true })
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .populate("vehicleId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const removeTransportAssignment = async (req: AuthRequest, res: Response) => {
  try {
    // Guarded so calling this twice on the same assignment (double-click,
    // retry) can't decrement a vehicle's occupied count twice for a single
    // removal - same class of bug as the hostel/library double-action fixes.
    const assignment = await TransportAssignment.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: "Assignment not found or already removed" });

    await Vehicle.findOneAndUpdate(
      { _id: assignment.vehicleId, schoolId: req.user!.schoolId, $expr: { $gt: ["$occupied", 0] } },
      { $inc: { occupied: -1 } }
    );

    res.json({ message: "Assignment removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
