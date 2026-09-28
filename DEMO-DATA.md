# Demo data + multi-school leak test

Three scripts in `server/src/scripts/demo/`. All demo schools are named `DEMO - School N`,
so cleanup can never touch a real school.

Run everything from the `server` folder (PowerShell):

```powershell
cd Desktop\bros-code-school\server

# 1) Create demo schools (default: 3 schools x 600 students).
#    Shows DB host + name first and asks you to type CONFIRM.
npm run seed:demo

# smaller / bigger:
$env:DEMO_SCHOOLS=2; $env:DEMO_STUDENTS=300; npm run seed:demo

# 2) Leak test (server must be running). Local:
$env:API_URL="http://localhost:5000/api"; npm run leak:test
#    or against the deployed API:
$env:API_URL="https://YOUR-API-DOMAIN/api"; npm run leak:test

# 3) Remove ALL demo data when finished (asks for CONFIRM):
npm run clean:demo
```

Demo logins (password `Demo@123` for everyone), for school N = 1, 2, 3:
`admin@sN.demo.broscode.test`, `accountant@`, `principal@`, `teacher1@`, `parent1@`, `student1@`
(all `@sN.demo.broscode.test`).

Notes
- The seeder refuses to run if demo schools already exist - run `clean:demo` first.
- Login is rate limited (20 per 15 min per IP); one leak-test run uses 5 logins per school.
  If you get a 429, wait 15 minutes.
- The leak test only reads, plus a few write attempts on OTHER schools' records that must be refused.
