import User from "../models/User";

// Blueprint 11 + 21/26/28 (Account States + Student/Teacher/Staff
// lifecycle): when a student withdraws/graduates, a teacher resigns, or a
// staff member is terminated, their login account must stop working -
// otherwise "removing" someone from the school is cosmetic only. This is
// called from the status-update controllers instead of duplicating the
// same User.findByIdAndUpdate in three places.
//
// Deliberately best-effort: if the linked User doc is missing for some
// reason, the calling status update (on the Student/Teacher/StaffProfile
// record, which is the thing the admin actually asked to change) should
// still succeed rather than fail because of this side effect.
export async function syncLinkedAccountStatus(
  userId: unknown,
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED",
  reason?: string
): Promise<void> {
  try {
    if (!userId) return;
    await User.findByIdAndUpdate(userId, { accountStatus: status, accountStatusReason: reason });
  } catch {
    // Swallow - see comment above. The audit log on the calling controller
    // already records the lifecycle change itself.
  }
}

// Maps a Student.status / Teacher.employmentStatus / StaffProfile.employmentStatus
// value to the account status it implies, or null if that value shouldn't
// change login access at all (e.g. ON_LEAVE, TRANSFERRED - still enrolled
// somewhere, may still need portal access).
export function accountStatusForLifecycleStatus(lifecycleStatus: string): "ACTIVE" | "SUSPENDED" | "ARCHIVED" | null {
  switch (lifecycleStatus) {
    case "ACTIVE":
      return "ACTIVE";
    case "SUSPENDED":
      return "SUSPENDED";
    case "WITHDRAWN":
    case "GRADUATED":
    case "ALUMNI":
    case "ARCHIVED":
    case "RESIGNED":
    case "TERMINATED":
      return "ARCHIVED";
    default:
      return null; // ON_LEAVE, TRANSFERRED, etc. - don't touch login access
  }
}
