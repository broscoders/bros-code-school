import School from "../models/School";
import Organization from "../models/Organization";
import User from "../models/User";

// Blueprint 15: packages define student/staff/branch limits and the app
// must actually enforce them (not just store the numbers). This is called
// before creating a new student or teacher account.
//
// Schools created before organizationId existed have no org link - for
// those we skip enforcement entirely rather than break existing schools
// that were never meant to be limited.
export async function checkOrgLimit(
  schoolId: string,
  kind: "STUDENT" | "TEACHER"
): Promise<{ allowed: boolean; message?: string }> {
  const school = await School.findById(schoolId);
  if (!school?.organizationId) return { allowed: true };

  const org = await Organization.findById(school.organizationId);
  if (!org) return { allowed: true };

  // A manually-set status still governs even before checking dates.
  if (org.subscriptionStatus === "SUSPENDED" || org.subscriptionStatus === "CANCELLED") {
    return { allowed: false, message: "Your organization's subscription is not active. Please contact support to reactivate it." };
  }
  if (org.subscriptionExpiresAt && org.subscriptionExpiresAt.getTime() < Date.now()) {
    return { allowed: false, message: "Your organization's subscription has expired. Please renew to add more accounts." };
  }

  const limit = kind === "STUDENT" ? org.studentLimit : org.staffLimit;
  if (!limit) return { allowed: true }; // no limit set = unlimited

  // Count across every school under this same organization, not just the
  // one making the request - a plan's limit applies to the whole
  // organization, branches included.
  const schoolIds = (await School.find({ organizationId: org._id }).select("_id")).map((s) => s._id);
  const role = kind === "STUDENT" ? "STUDENT" : "TEACHER";
  const currentCount = await User.countDocuments({ schoolId: { $in: schoolIds }, role });

  if (currentCount >= limit) {
    return {
      allowed: false,
      message: `Your organization's plan ("${org.planName}") allows up to ${limit} ${kind === "STUDENT" ? "students" : "staff members"}. Please upgrade your plan to add more.`,
    };
  }
  return { allowed: true };
}
