import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import Parent from "../models/Parent";

const STAFF_ROLES_WITH_SCHOOL_ACCESS = new Set([
  "SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ADMISSION_STAFF", "ACADEMIC_COORDINATOR",
  "ACCOUNTANT", "RECEPTIONIST", "LIBRARIAN", "TRANSPORT_MANAGER", "NURSE",
  "HOSTEL_WARDEN", "TEACHER", "ACADEMY_TEACHER",
]);

// Checks that the logged-in user is actually allowed to view/act on this specific
// student's records — not just that their role is generally permitted.
// Staff roles are trusted for any student within their own school (schoolId is
// checked separately wherever this is called). Students may only access their
// own record. Parents may only access their own children.
export async function canAccessStudent(req: AuthRequest, studentId: string): Promise<boolean> {
  const role = req.user!.role;

  if (STAFF_ROLES_WITH_SCHOOL_ACCESS.has(role)) {
    return true;
  }

  if (role === "STUDENT") {
    const student = await Student.findOne({ _id: studentId, schoolId: req.user!.schoolId });
    return !!student && student.userId.toString() === req.user!.userId;
  }

  if (role === "PARENT") {
    const parent = await Parent.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    if (!parent) return false;
    return parent.children.some((childId) => childId.toString() === studentId);
  }

  return false;
}