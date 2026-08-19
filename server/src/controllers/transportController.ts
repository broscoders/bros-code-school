import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Vehicle from "../models/Vehicle";

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
