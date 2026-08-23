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

export const assignStudentToVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId, vehicleId, monthlyFee } = req.body;

    const student = await Student.findOne({ _id: studentId, schoolId });
    if (!student) return res.status(404).json({ message: "Student not found in your school" });

    const vehicle = await Vehicle.findOne({ _id: vehicleId, schoolId });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found in your school" });

    const existing = await TransportAssignment.findOne({ schoolId, studentId, isActive: true });
    if (existing) {
      return res.status(400).json({ message: "This student is already assigned to a transport route. Remove the existing assignment first." });
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
    const assignment = await TransportAssignment.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { isActive: false },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Assignment removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
