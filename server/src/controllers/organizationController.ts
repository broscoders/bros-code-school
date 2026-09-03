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

// A few standard named packages a Super Admin can apply in one click,
// rather than typing raw limit numbers every time. "Custom" limits can
// still be set directly via the body for anything outside these presets.
const PLAN_PRESETS: Record<string, { studentLimit?: number; staffLimit?: number; branchLimit: number }> = {
  Trial: { studentLimit: 50, staffLimit: 10, branchLimit: 1 },
  Basic: { studentLimit: 300, staffLimit: 40, branchLimit: 1 },
  Pro: { studentLimit: 1500, staffLimit: 150, branchLimit: 5 },
  Enterprise: { staffLimit: undefined, studentLimit: undefined, branchLimit: 50 }, // unlimited students/staff
};

export const setOrganizationPlan = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const { planName, subscriptionStatus, subscriptionExpiresAt, studentLimit, staffLimit, branchLimit } = req.body;

    const preset = planName && PLAN_PRESETS[planName];
    const update: Record<string, any> = {};
    if (planName) update.planName = planName;
    if (subscriptionStatus) update.subscriptionStatus = subscriptionStatus;
    if (subscriptionExpiresAt !== undefined) update.subscriptionExpiresAt = subscriptionExpiresAt || undefined;
    // Explicit custom limits in the body always win over a preset's
    // defaults, so a Super Admin can pick "Pro" and then still bump the
    // student limit for one specific customer.
    update.studentLimit = studentLimit !== undefined ? studentLimit : preset?.studentLimit;
    update.staffLimit = staffLimit !== undefined ? staffLimit : preset?.staffLimit;
    update.branchLimit = branchLimit !== undefined ? branchLimit : preset?.branchLimit;

    const org = await Organization.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// So a Super Admin (or the org itself, eventually) can see "380/300
// students - over their plan limit" rather than limits being invisible
// numbers nobody checks.
export const getOrganizationUsage = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const schools = await School.find({ organizationId: org._id }).select("_id");
    const schoolIds = schools.map((s) => s._id);

    const [studentCount, staffCount] = await Promise.all([
      User.countDocuments({ schoolId: { $in: schoolIds }, role: "STUDENT" }),
      User.countDocuments({ schoolId: { $in: schoolIds }, role: "TEACHER" }),
    ]);

    res.json({
      branchCount: schoolIds.length,
      branchLimit: org.branchLimit,
      studentCount,
      studentLimit: org.studentLimit,
      staffCount,
      staffLimit: org.staffLimit,
      subscriptionStatus: org.subscriptionStatus,
      subscriptionExpiresAt: org.subscriptionExpiresAt,
    });
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
