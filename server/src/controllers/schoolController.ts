import type { Request, Response } from "express";
import School from "../models/School";

export const createSchool = async (req: Request, res: Response) => {
  try {
    const { name, logoUrl, primaryColor, secondaryColor, address, contactEmail, contactPhone } = req.body;

    if (!name) {
      return res.status(400).json({ message: "School name is required" });
    }

    const school = await School.create({
      name,
      logoUrl,
      primaryColor,
      secondaryColor,
      address,
      contactEmail,
      contactPhone,
    });

    res.status(201).json(school);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSchools = async (req: Request, res: Response) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSchoolById = async (req: Request, res: Response) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateSchool = async (req: Request, res: Response) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
