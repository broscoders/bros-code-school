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

// Top-level management.
export const TOP_ADMIN = [
  ROLES.SCHOOL_ADMIN,
  ROLES.PRINCIPAL,
];

// Every kind of school-office staff member.
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

// Academic structure.
export const ACADEMIC_STAFF = [
  ...TOP_ADMIN,
  ROLES.HEAD,
  ROLES.ACADEMIC_COORDINATOR,
];

// Teaching staff.
export const TEACHING_STAFF = [
  ...TOP_ADMIN,
  ROLES.HEAD,
  ROLES.ACADEMIC_COORDINATOR,
  ROLES.TEACHER,
  ROLES.ACADEMY_TEACHER,
];

// Admissions.
export const ADMISSIONS_STAFF = [
  ...TOP_ADMIN,
  ROLES.ADMISSION_STAFF,
  ROLES.RECEPTIONIST,
];

// Finance.
export const FINANCE_STAFF = [
  ...TOP_ADMIN,
  ROLES.ACCOUNTANT,
];

// Library.
export const LIBRARY_STAFF = [
  ...TOP_ADMIN,
  ROLES.LIBRARIAN,
];

// Transport.
export const TRANSPORT_STAFF = [
  ...TOP_ADMIN,
  ROLES.TRANSPORT_MANAGER,
];

// Front desk.
export const FRONT_DESK_STAFF = [
  ...TOP_ADMIN,
  ROLES.RECEPTIONIST,
  ROLES.HEAD,
];

// Health.
export const MEDICAL_STAFF = [
  ...TOP_ADMIN,
  ROLES.HEAD,
  ROLES.NURSE,
];

// Hostel.
export const HOSTEL_STAFF = [
  ...TOP_ADMIN,
  ROLES.HEAD,
  ROLES.HOSTEL_WARDEN,
];

// HR.
export const HR_MANAGERS = [
  ...TOP_ADMIN,
  ROLES.HEAD,
];

// Academy.
export const ACADEMY_STAFF = [
  ...TOP_ADMIN,
  ROLES.ACADEMY_TEACHER,
];

// All staff and teachers.
export const ALL_STAFF_AND_TEACHERS = [
  ...ANY_ADMIN_STAFF,
  ROLES.TEACHER,
  ROLES.ACADEMY_TEACHER,
];

// Every role.
export const EVERYONE = [
  ...ALL_STAFF_AND_TEACHERS,
  ROLES.PARENT,
  ROLES.STUDENT,
];
