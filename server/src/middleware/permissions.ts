// Central place to define which sub-roles can perform which kind of action.
// Import these groups into route files instead of typing out role lists by hand,
// so permission changes only need to happen in one place.

export const ROLES = {
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  PRINCIPAL: "PRINCIPAL",
  HEAD: "HEAD",
  ADMISSION_STAFF: "ADMISSION_STAFF",
  ACADEMIC_COORDINATOR: "ACADEMIC_COORDINATOR",
  ACCOUNTANT: "ACCOUNTANT",
  RECEPTIONIST: "RECEPTIONIST",
  LIBRARIAN: "LIBRARIAN",
  TRANSPORT_MANAGER: "TRANSPORT_MANAGER",
  NURSE: "NURSE",
  HOSTEL_WARDEN: "HOSTEL_WARDEN",
  TEACHER: "TEACHER",
  ACADEMY_TEACHER: "ACADEMY_TEACHER",
  PARENT: "PARENT",
  STUDENT: "STUDENT",
} as const;

// Top-level management: can do anything any sub-role can do, in every module.
export const TOP_ADMIN = [ROLES.SCHOOL_ADMIN, ROLES.PRINCIPAL];

// Every kind of school-office staff member (used for things every admin sub-role
// should see), but NOT teachers/parents/students.
export const ANY_ADMIN_STAFF = [
  ROLES.SCHOOL_ADMIN,
  ROLES.PRINCIPAL,
  ROLES.HEAD,
  ROLES.ADMISSION_STAFF,
  ROLES.ACADEMIC_COORDINATOR,
  ROLES.ACCOUNTANT,
  ROLES.RECEPTIONIST,
  ROLES.LIBRARIAN,
  ROLES.TRANSPORT_MANAGER,
  ROLES.NURSE,
  ROLES.HOSTEL_WARDEN,
];

// Academic structure: sessions, classes, sections, subjects, exams, results.
export const ACADEMIC_STAFF = [...TOP_ADMIN, ROLES.HEAD, ROLES.ACADEMIC_COORDINATOR];

// Anyone who actually teaches (marks attendance, sets homework, enters marks).
export const TEACHING_STAFF = [...TOP_ADMIN, ROLES.HEAD, ROLES.ACADEMIC_COORDINATOR, ROLES.TEACHER, ROLES.ACADEMY_TEACHER];

// Admissions pipeline (new student admissions + front-desk enquiries).
export const ADMISSIONS_STAFF = [...TOP_ADMIN, ROLES.ADMISSION_STAFF, ROLES.RECEPTIONIST];

// Fees, invoices, payments.
export const FINANCE_STAFF = [...TOP_ADMIN, ROLES.ACCOUNTANT];

// Library.
export const LIBRARY_STAFF = [...TOP_ADMIN, ROLES.LIBRARIAN];

// Transport / vehicles.
export const TRANSPORT_STAFF = [...TOP_ADMIN, ROLES.TRANSPORT_MANAGER];

// Front desk: complaints, general enquiries, visitor-facing tasks.
export const FRONT_DESK_STAFF = [...TOP_ADMIN, ROLES.RECEPTIONIST, ROLES.HEAD];

// Health records, medical incidents, visitor check-in.
export const MEDICAL_STAFF = [...TOP_ADMIN, ROLES.HEAD, ROLES.NURSE];

// Hostel buildings, rooms, allocations.
export const HOSTEL_STAFF = [...TOP_ADMIN, ROLES.HEAD, ROLES.HOSTEL_WARDEN];

// HR records + payroll (salary data - kept tight, top management only).
export const HR_MANAGERS = [...TOP_ADMIN, ROLES.HEAD];

// Paid academy programs/batches/enrollments/store.
export const ACADEMY_STAFF = [...TOP_ADMIN, ROLES.ACADEMY_TEACHER];

// Every logged-in staff/teacher role (no parents/students).
export const ALL_STAFF_AND_TEACHERS = [...ANY_ADMIN_STAFF, ROLES.TEACHER, ROLES.ACADEMY_TEACHER];

// Every role in the system. Used for read endpoints that any logged-in school
// member (including parents/students) should be able to reach.
export const EVERYONE = [...ALL_STAFF_AND_TEACHERS, ROLES.PARENT, ROLES.STUDENT];
