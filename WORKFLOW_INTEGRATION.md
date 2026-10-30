# Recruitment Operations

Open http://localhost:5173 and activate the designated Super Admin, Praveen Ambrose (Praveen.Ambrose@motherson.com), using a password you choose. Activation is restricted to localhost and is available only before the account has a usable password. Seeded demo credentials are retired. Existing unrelated data is retained.

## Daily work

1. Demand register: create or review a SOW, its customer/cluster, dates, skills, vacancy count, owner, replacement details and budget. Add a JD, then use the Screening tab to open the existing resume/interview features.
2. Candidate pipeline: create an application or link a screened candidate. Record recruiter, source, stage, feedback, dates and compensation fields. Imported applications with uncertain SOW IDs remain unlinked until reviewed.
3. Offers & joining: selection and offer stages populate event dates. Confirm actual joining before marking Joined. A linked offer reserves one vacancy; joining transfers the reservation; dropping the offer releases it. Reconciled historical allocations are transferred rather than counted twice. All joined vacancies automatically close a demand; releasing an automatically closed vacancy reopens it.
4. Due actions: feedback tasks use configured calendar-day rules. Interviews/tests and joining use their scheduled dates. Missing dates remain visible. Overdue tasks escalate in-app; no email is sent.
5. Reports: filter by customer/cluster and group candidate statuses by manager, recruiter, full SOW, customer, cluster or source. Date filters use internal submission date, matching the Excel dashboard basis. CSV exports protect against spreadsheet formula injection.

## Access

Super Admin controls imports, rules, staff and assignments. Managers can manage demands and applications only in granted customer/cluster scopes. Recruiters can update their applications in granted scopes and use existing screening. Imported RMs have a directory entry and a manager account with an unusable generated password; set a staff password and grant the appropriate scope before use. Directory mapping alone grants no access.

Staff sessions last 12 hours and are stored as hashed token digests. Passwords use salted scrypt. Previously stored passwords migrate on successful login. Interview invitations contain a signed seven-day candidate-specific capability. Old unsigned interview links must be reissued. Access checks run on the server. Administrative endpoints require an authenticated role.

## Migration and reconciliation

The source files remain unchanged. Imports preserve the original row, sheet and workbook, skip formula-only blank records, normalize known status spelling and retain unresolved data. Exact customer + full SOW matches link automatically. Numeric SOW IDs and SOW prefixes normalize; arbitrary last-four-character matching is not used. Repeated unchanged imports are no-ops. Revised rows keep app edits and surface changed-source issues for review. Row movement requires manual reconciliation rather than silently overwriting records.

The initial data contains 91 identified demand rows, 224 supply rows and 27 offer rows. Customer master lists 11 customers; 13 RM-to-cluster entries represent 12 distinct RMs. Existing customers are preserved alongside these masters. Some legacy customer labels may need merging or alias review.

There are 249 initial migration issues. Most are missing opening dates or unresolved SOW matches. Other issues include the manual Dashboard C6 count, AM41 Remarks multiplication, cluster omission in Summary_Bosch, and historical vacancy allocations lacking a linked application. One joined count in demand row 97 has no position code: original totals are 163 vacancies, 8 joined/closed and 20 hold/cancelled, while identified demand rows contain 7 joined/closed. The migration reconciliation table retains this difference.

Historical statuses and reservations do not always reconcile. Where an imported linked terminal application matches a historical allocation, that allocation transfers to the application. Otherwise its status is preserved with a reconciliation issue and no additional vacancy consumed. Review before operational use. Marking an issue reviewed does not change its record.

## Rules still requiring business inputs

- The workbook's active-vacancies × 30% target is configurable but initially unset because its business interpretation and rounding were not supplied.
- GM% stays editable until revenue/cost units and the calculation basis are defined.
- Initial feedback and escalation settings are proposed defaults (2 calendar days to feedback; escalation after 5 overdue days).
- Actual customer feedback, offers and joining confirmations must be entered or received from a connected system; AI scores do not mark candidates hired automatically.
- Email/calendar/SAP synchronization requires the relevant connected service and credentials. It is not configured or dispatched by this integration.

## Development and checks

Run `npm run dev` for the frontend on 5173 and backend on 8787; `npm run build` compiles the frontend. Run `node server/migrate-workflow.js` once to create a SQLite backup, prepare Praveen's pending activation and import the local workbooks. Running it again does not duplicate the same workbook batch. Source backups and the database backup are in `scratch/workflow-backup-20261008/`.

The migration uses ExcelJS and JSZip. Malformed Excel table filter metadata is stripped from an in-memory copy before reading; no workbook is saved back. Workbook uploads are bounded to 12 MB each and 60 MB expanded size. Source formulas are translated into app calculations, not executed as arbitrary code.

Validation covers build, source extraction counts, repeated imports, session authentication, restricted setup, customer/cluster access, stage dates, offer-to-joining reservations, missing-date rejection, optimistic concurrency and history. Browser verification covers the dashboard, register, record fields and filtering against an isolated database. SQLite remains the existing local persistence model; shared cloud deployment and concurrent multi-instance storage need separate validation.
