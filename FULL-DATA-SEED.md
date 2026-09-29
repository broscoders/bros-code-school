# Full demo-style dataset for your EXISTING real school

Like `seed:demo`, but instead of creating brand-new schools, it adds a full
demo-school-style dataset (Grade 1-10, sections A/B, families with 1-3 kids,
fees, attendance, exams/results, homework, assignments, announcements,
events, admission leads) into ONE EXISTING school - the same one
`seedMockData.ts` / `seedVolumeTest.ts` use.

Run from the `server` folder, against your real `MONGODB_URI` in `.env`:

```powershell
cd Desktop\bros-code-school\server
npm run seed:full
```

It shows the DB host + name first and asks you to type `CONFIRM`. Default is
600 students; change with `$env:STUDENTS=200; npm run seed:full`.

**How it treats classes that already exist:** if your school already has a
"Grade 9", "Grade 10", etc. from an earlier seed script, this reuses that
same class/section/subject instead of duplicating it, and any real students
already in it are left completely alone - the new students are simply added
alongside them.

**Login:** your existing school admin login is untouched and still works.
New sample logins (password for all: `Test@123`):
`teacher1@demo.brosschool.local`, `parent1@demo.brosschool.local`,
`student1@demo.brosschool.local`.

When you're done looking at it, remove all of it:

```powershell
npm run clean:full
```

This deletes only what the seeder added - matched by `DC-` admission
numbers, `@demo.brosschool.local` emails, and `[Demo Data]`-tagged
homework/announcements/events. A class is only removed if, after that
cleanup, it has zero students left in it - so a class you reused (like a
real "Grade 9") that still has real students is always left in place, along
with its sections and subjects.
