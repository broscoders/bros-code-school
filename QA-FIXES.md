# QA fixes (this branch)

Fixes for the issues found while load-testing multiple demo schools together
(see DEMO-DATA.md). Every fix was verified with
`server/src/scripts/verify/verifyFixes.ts` against a scratch database before
committing (18/18 checks pass):

```powershell
cd server
npx tsx src/scripts/verify/verifyFixes.ts   # uses MONGODB_URI from .env - use a test DB, not production
```

## What changed

1. **Overpayment** - `PUT /ops/invoices/:id/pay` now rejects a payment larger
   than the remaining balance, rejects paying an already-fully-paid or
   cancelled invoice, and undoes itself if two payments land at the same
   moment and together exceed the invoice amount.
2. **Negative / invalid invoice amounts** - `POST /ops/invoices` and the bulk
   invoice endpoint both reject a zero/negative/missing amount, missing fee
   type, or missing/invalid due date.
3. **Cross-school invoice** - `POST /ops/invoices` now checks the student
   belongs to the accountant's own school before creating the invoice
   (previously it trusted `studentId` from the request body). Only
   whitelisted fields are read from the body now, instead of spreading
   `...req.body` into the new Invoice.
4. **Refund limit** - `POST /finance/refunds` validates amount/reason, checks
   the student and invoice belong to the caller's school, and caps the
   refund at what was actually paid (minus any other refund still pending
   approval on the same invoice). The same cap is re-checked at approval
   time, before the refund is marked APPROVED, so approving two competing
   refund requests can't overshoot the invoice.
5. **Attendance `markedBy` spoofing** - `POST /ops/attendance` now always
   uses the logged-in user's id for `markedBy` and the student's own
   class/section, instead of trusting those fields from the request body.
6. **Audit log name spoofing** - `logAudit` now always looks up the acting
   user's name from their account, instead of trusting a name field some
   callers took from the request body.
7. **Branding leak on multi-school setups** - `/schools/public/branding`
   used to always return whichever active school was first, so a second
   school's login page showed the first school's name/logo. It now supports
   `?schoolId=`, a `BRANDING_SCHOOL_ID` env var (for one-school-per-deployment
   setups), and otherwise only auto-picks a school if exactly one exists.
8. **Invoice list silently capped at 2000** - `GET /ops/invoices/all` now
   pages (`?page=&limit=`, max 2000/page) and returns the true total via an
   `X-Total-Count` response header, so a school with more than 2000 invoices
   no longer gets a silently incomplete list. `Reports.tsx`'s CSV export now
   pages through all of them instead of only the first 2000.

## Not included here

These were also found during QA but are bigger/product decisions, not one-line
fixes, so they're left for a follow-up:
- No payment ledger / receipt numbers (Invoice only tracks a running
  `paidAmount`, not individual payments)
- No duplicate-invoice guard (same student can get two "Tuition" invoices)
- Results require `marksObtained` - no way to record an absent/exempt student
- Attendance has no "EXCUSED" status and doesn't block future-dated entries
- Students can only have one guardian (`parentId`), no authorized pickup list
