# Testing Handoff — Bros Code School Management System

This document covers everything changed in this working session (16 merged
commits/features on `main`). Each item below lists **what changed**, **why**,
and **exactly what to test**. Both the server and client compile cleanly and
build successfully — this has NOT been functionally tested against a live
database, so real click-through testing is essential before this goes live.

---

## 🔴 Critical — test these first

### 1. Fee payment can no longer be recorded by a parent
- **What changed:** `PUT /ops/invoices/:id/pay` used to allow the `PARENT`
  role directly. It's now staff-only (Accountant/Admin/Principal).
- **Why:** There is no real payment gateway behind this endpoint — it
  trusted whatever amount was sent in the request. A parent could have
  marked their own child's fees as fully paid without ever paying.
- **Test:**
  - As a parent, confirm there is (and was) no "Pay Now" button anywhere
    in the Parent Fees screen — payments should only ever be recorded by
    an Accountant/Admin from the school-side Fees screen.
  - As an Accountant, confirm recording a payment (full or partial) still
    works normally and updates the invoice status correctly.

### 2. Store items can no longer be "bought" for free
- **What changed:** `POST /store/purchase` now blocks students/parents
  from self-checking-out any **paid** item. Free items still work with
  one click. Staff (Academy admin/teacher) can grant access manually via
  a new "Grant" control on the Academy page.
- **Test:**
  - As a student, confirm a **free** item in the Notes Store still grants
    access immediately with "Get Access."
  - As a student, confirm a **paid** item now shows "Request Access" and
    returns a message about contacting the office (no file access granted).
  - As an Admin/Academy staff, go to Academy → Store, pick a paid item,
    select a student from "Grant to...", click Grant, and confirm the
    student now has access.

### 3. Two-Factor Authentication now also protects Google Sign-In
- **What changed:** 2FA previously only applied to password login;
  Google Sign-In bypassed it entirely.
- **Test:** Enable 2FA on a test account (Settings → Two-Factor Auth →
  scan QR with an authenticator app). Log out. Try logging in with
  **Google Sign-In** on that same account — it should now ask for the
  6-digit code before granting access, same as password login.

### 4. Suspending/deactivating an account now actually works
- **What changed:** The `isActive`/account-status field on User accounts
  was never checked anywhere before. Now `accountStatus`
  (ACTIVE/SUSPENDED/ARCHIVED) is enforced at login **and** on every
  subsequent request.
- **Test:**
  - Mark a Teacher's employment status as RESIGNED/TERMINATED, or a
    Student's status as WITHDRAWN/GRADUATED. Confirm that user can no
    longer log in.
  - As a Top Admin, use the new account-status control (API: `PUT
    /people/users/:id/account-status`) to suspend a staff account and
    confirm they're logged out of all devices immediately and can't log
    back in.

### 5. Teachers can only act on their own assigned classes
- **What changed:** Attendance, exam results, homework, assignments, LMS
  courses, and quizzes now check that a Teacher is actually assigned to
  the class in question, not just any class in the school.
- **⚠️ Test this carefully:** Before testing, confirm each test Teacher
  account has `assignedClasses` populated correctly on their profile. If
  it's empty, they'll get a 403 "not assigned to this class" error on
  actions that used to silently work — that's the fix working as
  intended, not a new bug, but it will look like one if teacher-class
  assignments aren't set up first.
  - Same applies to Academy Teachers and their batches (a batch's
    `teacherId` must match the logged-in instructor).

### 6. Leave requests can't be self-approved
- **What changed:** A Head or Academic Coordinator could previously file
  their own leave request and approve it themselves.
- **Test:** As a Head/Academic Coordinator, file a leave request for
  yourself, then try to approve it from the Leave Requests screen —
  confirm this is blocked and a different admin has to approve it.

---

## 🟡 New features to test end-to-end

### 7. Invitations (replaces/adds to direct account creation)
- Admin → Invitations → send an invite to a test email → check the email
  arrives → open the link → set a password → log in with it.
- Test resend and revoke buttons.
- Confirm an expired (7+ day old, or manually expired) invitation shows
  the right error when opened.

### 8. Active Sessions & Logout
- Log into the same account from two different browsers/devices.
- Open "Active Sessions" (available in every role's sidebar/profile
  menu) — confirm both sessions show up.
- Revoke the other session — confirm that device gets logged out
  immediately (next action there should redirect to login).
- Change your password — confirm all *other* sessions are logged out but
  your current one stays logged in.
- Use "Forgot Password" to reset — confirm this logs out **all**
  sessions, including the current one.

### 9. Bulk Import (Students/Teachers)
- Upload a CSV — confirm you now see a **preview** (created/skipped
  counts + error list) before anything is actually imported.
- Confirm each imported account gets a **different** random password
  (not the same for everyone), and that a "Download credentials CSV" link
  appears in case email isn't set up.
- Try uploading a file with a duplicate email already in the system —
  confirm it's correctly skipped with a clear reason.

### 10. New pages that previously didn't exist
These modules had working backends but no UI before — please test the
full flow, not just that the page loads:
- **Achievements** (Admin/Teacher record one → Student & Parent see it)
- **Calendar & Events** (Admin creates an event → Teacher/Student/Parent
  see it under "Calendar & Events")
- **Report an Issue** (Teacher/Student/Parent file a ticket → confirm it
  shows up for Front Desk staff, and the filer can see their own ticket's
  status update after staff changes it)
- **Health Profile** (Parent should see their own child's allergy/blood
  group info, read-only)
- **Discipline** (Parent should see their own child's discipline record
  when notified — previously the notification pointed to a page that
  didn't exist)
- **Communication Log** (Admin → Communication Log — trigger a password
  reset or invitation email and confirm it shows up as Sent/Failed)
- **LMS Overview / Online Exams** (Admin can now see all courses/quizzes
  across the school, not just per-teacher)

### 11. Admission → auto-created parent account
- Run through Admissions → approve an admission that creates a new
  parent account → check the parent's welcome email → confirm the
  verification code in the email **actually works** (this was broken
  before — the emailed code didn't match the stored one).

### 12. Academy program/batch permissions
- As an Academy Teacher, confirm you can only create/manage batches
  under your own name — creating a program (the course catalog) should
  now be Admin-only.
- Confirm you can't mark a batch you don't own as Completed/Cancelled.

---

## Notes for the dev/ops team
- No new environment variables are required — everything reuses
  `CLIENT_URL`, `JWT_SECRET`, and the existing SMTP settings.
- Two new npm packages were added to the server: `otplib` and `qrcode`
  (for 2FA). Run `npm install` on the server before deploying if you
  haven't already pulled these commits.
- Not covered in this session (would need your input/credentials to
  proceed): SMS/WhatsApp notification channels, and any real payment
  gateway integration for the Store/Fees "pay online" flows described in
  the original product spec.
