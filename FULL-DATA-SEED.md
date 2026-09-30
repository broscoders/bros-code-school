# Full demo-style dataset for your EXISTING real school

Two scripts that add a full demo-school-style dataset into ONE EXISTING
school (the same one `seedMockData.ts` / `seedVolumeTest.ts` use) instead of
creating brand-new schools:

1. **`npm run seed:full`** - students, parents, classes (Grade 1-10,
   sections A/B), teachers, fees, attendance, exams/results.
2. **`npm run seed:sections`** - every other sidebar section: HR/Staff
   (accountant, receptionist, librarian, transport manager, nurse, hostel
   warden, admissions officer, academic coordinator), Staff Attendance,
   Leave Requests, Timetable, LMS (courses/lessons/quizzes), Accounting
   (expenses), Payroll, Hostel, Library, Transport, Canteen, Inventory &
   Assets, Maintenance, Discipline, Achievements, Visitors, Health &
   Medical, Leads/CRM, Certificates, ID Cards, Documents, Surveys.

Run `seed:full` first, then `seed:sections` (it needs the students/teachers
`seed:full` creates).

```powershell
cd Desktop\bros-code-school\server
npm run seed:full
npm run seed:sections
```

Both show the DB host + name first and ask you to type `CONFIRM`.

## Adding more / "doubling" the data

Both scripts are **safe to run again** - running `seed:full` a second time
(with the same or a different `STUDENTS` number) adds that many *more*
students on top of what's already there, continuing the numbering rather
than recreating the first batch:

```powershell
$env:STUDENTS=600; npm run seed:full   # first run: 600 students
$env:STUDENTS=650; npm run seed:full   # run again: +650 more (≈1250 total)
npm run seed:sections                  # fills in the new students only -
                                        # staff, hostel buildings, library
                                        # catalog etc. are NOT duplicated
```

**How it treats classes that already exist:** if your school already has a
"Grade 9", "Grade 10", etc. from an earlier seed script, `seed:full` reuses
that same class/section/subject instead of duplicating it, and any real
students already in it are left completely alone - the new students are
simply added alongside them.

**Login:** your existing school admin login is untouched and still works.
Sample logins (password for all: `Test@123`):
- `teacher1@demo.brosschool.local`, `parent1@demo.brosschool.local`,
  `student1@demo.brosschool.local` (from `seed:full`)
- `staff1@demo.brosschool.local` .. `staff8@demo.brosschool.local` - staff1
  is the Accountant, staff2 Receptionist, staff3 Librarian, staff4
  Transport Manager, staff5 Nurse, staff6 Hostel Warden, staff7 Admissions
  Officer, staff8 Academic Coordinator (from `seed:sections`)

## Cleaning up

```powershell
npm run clean:full
```

This one cleanup script covers everything both seeders added - matched by
`DC-` admission/employee numbers, `@demo.brosschool.local` emails, and
`[Demo Data]`-tagged catalog records (hostel buildings, library titles,
vehicles, canteen menu, inventory, assets, leads, documents, surveys,
homework/announcements/events). A "Grade N" class is only removed if, after
cleanup, it has zero students left in it - so a class you reused (like a
real "Grade 9") that still has real students is always left in place, along
with its sections and subjects.
