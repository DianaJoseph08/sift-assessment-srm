# Recruitment operating flow

## Responsibilities

| Action | Super Admin | Manager | Recruiter |
| --- | --- | --- | --- |
| Customers, clusters, users, access and system settings | Manage | Own-scope recruiter provisioning | View assigned scope |
| Job description, criteria, posting, closure/reopening | Monitor only | Manage assigned customers/clusters | Read posted/closed assigned jobs |
| Resume upload and AI screening | Monitor only | Monitor only | Work on posted assigned jobs |
| AI interview / comparison | Monitor results | Monitor results | Perform on posted assigned jobs |
| Candidate details, decisions, offers, joining and follow-up | Read only | Read only | Assigned recruiter updates |
| Assign recruiter ownership of an application | Read only | Manage within assigned scope | Read own assignment |
| Export compiled candidate results | View/export across system | View/export within assigned scope | Compile within assigned scope |
| Historical Excel migration and derived-data resync | Administrative maintenance | No | No |

Admin remains responsible for structural provisioning and maintenance; operational JD/job/candidate actions are read only. Historical admin-created jobs remain intact.

## Daily operation

1. Admin creates customers/clusters and provisions manager/recruiter accounts and access. A manager can have multiple cluster assignments.
2. A manager writes the JD and criteria and posts the job. Missing JD/title or invalid scope blocks posting. The generated company/cluster/title/number Job ID is retained.
3. Recruiters open a posted job, upload resumes and screen them. Upload and screening populate the demand, candidate tracker, scores and dashboards automatically.
4. Recruiters run AI interviews and compile results. Interview scores come from the server evaluator, not hard-coded popup scores or client-provided overrides. Failures remain unavailable and can be retried. Invitations are manually composed; no delivery service is configured by this change.
5. Recruiters move their candidates through feedback, selection, offer and joining stages. Required dates, reasons, vacancy reservations and audit versions remain enforced. Joining requires a confirmed actual date.
6. Admin and managers open Jobs & candidate results / Job Postings to review scores, interview outcomes, recruiter ownership and candidate status. Export compiled results or use Candidate status & follow-up to open a job-filtered pipeline.
7. Managers close jobs when appropriate. New uploads/screening/interviews stop on closed jobs; recruiters can still update existing offer/joining follow-up. Screened candidates are retained for audit.

Admin and manager monitoring refreshes periodically. The recruiter workspace has posted-job review, upload, screening/interviews, compiled results and a direct follow-up action. Historical applications can be assigned to the correct recruiter by a manager through the candidate view, without changing candidate scores or status.

## Enforcement and tests

Server checks enforce roles independently of hidden UI buttons. Recruiters cannot edit posting metadata or submit fake screening scores. Admin cannot use job/demand/candidate mutation endpoints. Managers cannot upload or alter candidate results. All activity remains scoped to assigned customers and clusters. Omitted jobs in a save payload are preserved.

Run `npm test` for the current permission-aware regression suite. `tests/workflow-integration-test.mjs` and `tests/tracker-automation-test.mjs` delegate to the current role-flow integration test because the former tests assumed Admin could post jobs.

Tests import the complete source workbooks and run a manager → recruiter → monitoring → offer → joined flow in an isolated database. Trusted screening/interview results are seeded directly into that test database; no paid AI, email delivery, webcam or cloud deployment is exercised. Static role UI rendering and the production build are checked separately. Real provider reliability and browser interaction still require UAT.

The earlier deployment limitations in GO_LIVE_READINESS.md remain applicable. This change does not deploy the app or replace the local SQLite storage design.
