# Capacity / volume test (how much fits in the Atlas free tier)

Adds a large amount of data to ONE EXISTING school (the same one
`seedMockData.ts` / `seedMockData2.ts` / `seedMockData3.ts` use) so you can
watch, live, how much data fits in your MongoDB Atlas plan. It never touches
that school's real academic data - it creates its own classes
("VolTest Grade 1", "VolTest Grade 2", ...) and its own students/parents,
all tagged so they can be removed cleanly afterward.

Run from the `server` folder, against your real `MONGODB_URI` in `.env`:

```powershell
cd Desktop\bros-code-school\server
npm run seed:volume
```

It shows the DB host + name first and asks you to type `CONFIRM`. It then adds
data in batches, printing the live database size after every batch, and
**stops itself automatically** before the database gets full - by default at
~460 MB (90% of the Atlas M0 free tier's 512 MB cap), or after 25 minutes,
or after 200,000 students - whichever comes first.

Adjust with environment variables if needed, e.g. a shorter test:

```powershell
$env:MAX_MINUTES=5; $env:SAFETY_CAP_MB=100; npm run seed:volume
```

See the comment at the top of `server/src/scripts/volumetest/seedVolumeTest.ts`
for every option (`STUDENTS_PER_BATCH`, `CLASSES_COUNT`, `ATTENDANCE_DAYS`,
`SCHOOL_ID`, etc).

When you're done looking at the numbers, remove all of it:

```powershell
npm run clean:volume
```

This deletes only what the seeder added (matched by the `VOLTEST-` admission
number prefix, `@loadtest.broscode.internal` emails, and `VolTest ...`
class/section/subject/exam names) - your school's real students, classes,
invoices, etc. are never touched or modified.

**Notes**
- Filling a shared production database close to its storage cap can slow
  down or break anything else relying on that same cluster while the test
  data sits there - run `clean:volume` as soon as you're done reading the
  numbers, rather than leaving it in place.
- If your MongoDB Atlas plan is not M0, check the actual limit for your tier
  before relying on the default 460 MB safety cap.
