import type { Response } from "express";
import bcrypt from "bcryptjs";
import type { PlatformAuthRequest } from "../middleware/platformAuthMiddleware";
import Organization from "../models/Organization";
import School from "../models/School";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";

export const createOrganization = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const { adminName, adminEmail, adminPassword, ...orgFields } = req.body;
    const org = await Organization.create({ ...orgFields, status: "PENDING" });

    const school = await School.create({
      organizationId: org._id,
      name: orgFields.name,
      contactEmail: orgFields.ownerEmail,
      contactPhone: orgFields.ownerPhone,
    });

    let adminUser = null;
    if (adminEmail && adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await User.create({
        name: adminName || orgFields.ownerName,
        email: adminEmail,
        password: hashedPassword,
        role: "SCHOOL_ADMIN",
        schoolId: school._id,
        isEmailVerified: true,
      });
    }

    res.status(201).json({ organization: org, mainBranch: school, adminUser });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getOrganizations = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getOrganizationById = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    const branches = await School.find({ organizationId: org._id });
    res.json({ organization: org, branches });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateOrganization = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const setOrganizationStatus = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const org = await Organization.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!org) return res.status(404).json({ message: "Organization not found" });

    await School.updateMany({ organizationId: org._id }, { isActive: status === "ACTIVE" });

    res.json(org);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const addBranch = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const existingCount = await School.countDocuments({ organizationId: org._id });
    if (org.branchLimit && existingCount >= org.branchLimit) {
      return res.status(400).json({ message: `Branch limit (${org.branchLimit}) reached for this organization's plan.` });
    }

    const school = await School.create({ ...req.body, organizationId: org._id });
    res.status(201).json(school);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getPlatformStats = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const [totalOrgs, activeOrgs, suspendedOrgs, totalSchools, totalStudents, totalTeachers, totalStaff] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: "ACTIVE" }),
      Organization.countDocuments({ status: "SUSPENDED" }),
      School.countDocuments(),
      Student.countDocuments(),
      Teacher.countDocuments(),
      User.countDocuments({ role: { $nin: ["STUDENT", "PARENT"] } }),
    ]);

    const recentOrgs = await Organization.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      suspendedOrganizations: suspendedOrgs,
      totalSchools,
      totalStudents,
      totalTeachers,
      totalStaff,
      recentOrganizations: recentOrgs,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
