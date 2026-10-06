import type { Response } from "express";
import bcrypt from "bcryptjs";
import type { PlatformAuthRequest } from "../middleware/platformAuthMiddleware";
import Organization from "../models/Organization";
import School from "../models/School";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Section from "../models/Section";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());
// profile fields a Super Admin may set - plan/limits/status have their own endpoints
const ORG_PROFILE_FIELDS = ["name", "type", "ownerName", "ownerEmail", "ownerPhone", "address", "country", "city", "logoUrl", "approxStudents"] as const;

export const createOrganization = async (req: PlatformAuthRequest, res: Response) => {
  let org: any = null;
  let school: any = null;
  try {
    const { adminName, adminPassword } = req.body;
    const adminEmail = s(req.body.adminEmail).toLowerCase();
    const name = s(req.body.name);
    const ownerName = s(req.body.ownerName);
    const ownerEmail = s(req.body.ownerEmail);
    if (!name || !ownerName || !ownerEmail) return res.status(400).json({ message: "Organization name, owner name and owner email are required" });
    if (!EMAIL_RE.test(ownerEmail)) return res.status(400).json({ message: "Owner email is not valid" });
    if (adminEmail || adminPassword) {
      if (!adminEmail || !adminPassword) return res.status(400).json({ message: "Provide both the admin email and password, or neither" });
      if (!EMAIL_RE.test(adminEmail)) return res.status(400).json({ message: "Admin email is not valid" });
      if (String(adminPassword).length < 8) return res.status(400).json({ message: "Admin password must be at least 8 characters" });
      // checked BEFORE anything is created: a taken email used to fail at the
      // last step and leave an organization and school with no admin behind
      if (await User.exists({ email: adminEmail })) return res.status(409).json({ message: "A user with this admin email already exists" });
    }

    const fields: Record<string, unknown> = {};
    for (const f of ORG_PROFILE_FIELDS) if (req.body[f] !== undefined) fields[f] = typeof req.body[f] === "string" ? req.body[f].trim() : req.body[f];
    org = await Organization.create({ ...fields, status: "PENDING" });

    school = await School.create({
      organizationId: org._id,
      name,
      contactEmail: ownerEmail,
      contactPhone: s(req.body.ownerPhone) || undefined,
    });

    let adminUser = null;
    if (adminEmail && adminPassword) {
      const hashedPassword = await bcrypt.hash(String(adminPassword), 10);
      adminUser = await User.create({
        name: s(adminName) || ownerName,
        email: adminEmail,
        password: hashedPassword,
        role: "SCHOOL_ADMIN",
        schoolId: school._id,
        isEmailVerified: true,
      });
    }

    res.status(201).json({ organization: org, mainBranch: school, adminUser });
  } catch (err) {
    // don't leave a half-created organization behind
    if (school) await School.deleteOne({ _id: school._id }).catch(() => {});
    if (org) await Organization.deleteOne({ _id: org._id }).catch(() => {});
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
    // Only profile details. The whole body used to be applied, so this
    // endpoint could also flip status (skipping the school activate/deactivate
    // step in setOrganizationStatus) or raise plan limits.
    const update: Record<string, unknown> = {};
    for (const f of ORG_PROFILE_FIELDS) if (req.body[f] !== undefined) update[f] = typeof req.body[f] === "string" ? req.body[f].trim() : req.body[f];
    if (update.ownerEmail !== undefined && !EMAIL_RE.test(String(update.ownerEmail))) return res.status(400).json({ message: "Owner email is not valid" });
    if (Object.keys(update).length === 0) return res.status(400).json({ message: "Nothing to update" });
    const org = await Organization.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
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
    const { planName, subscriptionStatus, subscriptionExpiresAt } = req.body;
    if (planName && !PLAN_PRESETS[planName] && planName !== "Custom") return res.status(400).json({ message: "Unknown plan" });
    if (subscriptionStatus && !["ACTIVE", "TRIAL", "EXPIRED", "CANCELLED"].includes(subscriptionStatus)) {
      // keep in step with the model's own list
      const allowed = (Organization.schema.path("subscriptionStatus") as any)?.enumValues as string[] | undefined;
      if (!allowed || !allowed.includes(subscriptionStatus)) return res.status(400).json({ message: "Invalid subscription status" });
    }
    const num = (v: unknown) => (v === "" || v === null ? null : Number(v));
    for (const [label, v] of [["Student limit", req.body.studentLimit], ["Staff limit", req.body.staffLimit], ["Branch limit", req.body.branchLimit]] as const) {
      if (v !== undefined && num(v) !== null && (!Number.isInteger(num(v)) || (num(v) as number) < 0)) {
        return res.status(400).json({ message: `${label} must be a whole number of 0 or more` });
      }
    }
    let expires: Date | null | undefined;
    if (subscriptionExpiresAt !== undefined) {
      expires = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
      if (expires && Number.isNaN(expires.getTime())) return res.status(400).json({ message: "Invalid expiry date" });
    }

    const preset = planName && PLAN_PRESETS[planName];
    const $set: Record<string, any> = {};
    const $unset: Record<string, 1> = {};
    if (planName) $set.planName = planName;
    if (subscriptionStatus) $set.subscriptionStatus = subscriptionStatus;
    if (expires === null) $unset.subscriptionExpiresAt = 1;
    else if (expires) $set.subscriptionExpiresAt = expires;

    // explicit limits win over a preset; an "unlimited" preset (Enterprise)
    // really removes the limit. Setting the field to `undefined` (what this
    // used to do) is not a reliable way to clear it.
    for (const key of ["studentLimit", "staffLimit", "branchLimit"] as const) {
      const explicit = req.body[key];
      if (explicit !== undefined) {
        const n = num(explicit);
        if (n === null) $unset[key] = 1; else $set[key] = n;
      } else if (preset) {
        const pv = (preset as any)[key];
        if (pv === undefined) $unset[key] = 1; else $set[key] = pv;
      }
    }
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) },
      { new: true }
    );
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

    const branchName = String(req.body.name || "").trim();
    if (!branchName) return res.status(400).json({ message: "Branch name is required" });
    // only these fields - organizationId/isActive/slug are not client-controlled
    const school = await School.create({
      organizationId: org._id,
      name: branchName,
      contactEmail: String(req.body.contactEmail || "").trim() || undefined,
      contactPhone: String(req.body.contactPhone || "").trim() || undefined,
      address: String(req.body.address || "").trim() || undefined,
    });
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

// Blueprint edge cases: "Student changes campus/school", "Teacher
// transfers branch", "User transferred between branches". Only a
// Super Admin can do this - a branch's own School Admin has no
// authority (or JWT scope) over any OTHER branch, so a same-org,
// cross-branch move has to be initiated from the organization level.
// History is preserved (schoolHistory / a note in the audit trail),
// never overwritten, matching how class transfers already work.
export const transferPersonBranch = async (req: PlatformAuthRequest, res: Response) => {
  try {
    const { personType, personId, toSchoolId } = req.body;
    if (!["STUDENT", "TEACHER"].includes(personType)) {
      return res.status(400).json({ message: "Invalid person type" });
    }

    const targetSchool = await School.findById(toSchoolId);
    if (!targetSchool) return res.status(404).json({ message: "Target school not found" });

    const person = personType === "STUDENT" ? await Student.findById(personId) : await Teacher.findById(personId);
    if (!person) return res.status(404).json({ message: "Person not found" });

    const sourceSchool = await School.findById(person.schoolId);
    // Both schools must belong to the same organization - this is a
    // branch transfer within one organization, not a way to move a
    // person into an unrelated organization's data.
    if (!sourceSchool?.organizationId || !targetSchool.organizationId || sourceSchool.organizationId.toString() !== targetSchool.organizationId.toString()) {
      return res.status(400).json({ message: "Both schools must belong to the same organization to transfer between them." });
    }

    const previousSchoolId = person.schoolId;
    if (previousSchoolId.toString() === String(toSchoolId)) {
      return res.status(400).json({ message: "The person is already in that school" });
    }

    // A student's class and section belong to the OLD school. Moving only the
    // school id left the student pointing at a class that doesn't exist in the
    // new school, so they vanished from every class list. The destination
    // class and section are now required and must belong to the target school.
    if (personType === "STUDENT") {
      const { toClassId, toSectionId } = req.body;
      if (!toClassId || !toSectionId) {
        return res.status(400).json({ message: "Choose the destination class and section for the student" });
      }
      if (!(await Section.exists({ _id: toSectionId, classId: toClassId, schoolId: toSchoolId }))) {
        return res.status(400).json({ message: "That class/section does not exist in the destination school" });
      }
    }

    if (personType === "STUDENT") {
      const student = person as any;
      student.schoolHistory = student.schoolHistory || [];
      const lastEntry = student.schoolHistory[student.schoolHistory.length - 1];
      if (lastEntry && !lastEntry.toDate) lastEntry.toDate = new Date();
      student.schoolHistory.push({ schoolId: toSchoolId, fromDate: new Date() });
      student.schoolId = toSchoolId;
      student.classId = req.body.toClassId;
      student.sectionId = req.body.toSectionId;
      student.classHistory = student.classHistory || [];
      const lastClass = student.classHistory[student.classHistory.length - 1];
      if (lastClass && !lastClass.toDate) lastClass.toDate = new Date();
      student.classHistory.push({ classId: req.body.toClassId, sectionId: req.body.toSectionId, fromDate: new Date() });
      await student.save();
    } else {
      // the teacher's classes and subjects belong to the old school too -
      // clear them so nothing points across schools; the new school assigns afresh
      (person as any).assignedClasses = [];
      (person as any).subjects = [];
      person.schoolId = toSchoolId as any;
      await person.save();
    }

    await User.findByIdAndUpdate(person.userId, { schoolId: toSchoolId });

    res.json({ message: "Transfer complete", personType, personId, fromSchoolId: previousSchoolId, toSchoolId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
