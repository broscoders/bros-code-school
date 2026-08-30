import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
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

export const getSchoolById = async (req: AuthRequest, res: Response) => {
  try {
    // Without this check, any logged-in user - regardless of which school
    // they belong to - could fetch any other school's profile just by
    // changing the :id in the URL, breaking the isolation the blueprint
    // requires between organizations/branches.
    if (req.params.id !== req.user!.schoolId) {
      return res.status(403).json({ message: "You can only view your own school" });
    }
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateSchool = async (req: AuthRequest, res: Response) => {
  try {
    // A school admin/principal must only ever be able to edit their own
    // school - without this check, PUT /schools/:id took whatever :id was
    // given, so an admin from one school could edit (or deactivate) any
    // other school in the system just by changing the URL.
    if (req.params.id !== req.user!.schoolId) {
      return res.status(403).json({ message: "You can only update your own school" });
    }

    // isActive is a platform-level suspension flag (set by Super Admin when
    // a subscription lapses, etc.) - a school-level admin must never be able
    // to toggle it back on for themselves, so it - along with any other
    // platform-controlled field - is deliberately excluded here even though
    // the model allows it.
    const { name, logoUrl, primaryColor, secondaryColor, address, contactEmail, contactPhone } = req.body;
    const updatePayload = {
      ...(name !== undefined ? { name } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(primaryColor !== undefined ? { primaryColor } : {}),
      ...(secondaryColor !== undefined ? { secondaryColor } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(contactEmail !== undefined ? { contactEmail } : {}),
      ...(contactPhone !== undefined ? { contactPhone } : {}),
    };

    const school = await School.findByIdAndUpdate(req.params.id, updatePayload, {
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
