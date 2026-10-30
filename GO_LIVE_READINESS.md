# Release readiness — 9 October 2026

**Decision: NO-GO for public production. Local workflow validation passes.**

## Executed checks

| Check | Result |
| --- | --- |
| Clean locked dependency installation and Vite production build | Passed; 1 MB bundle warning remains |
| Formula/date/stage/vacancy rules | 11 assertions passed, including India timezone and invalid dates |
| Actual workbook import into isolated test DB | 91 demands, 224 supply rows, 27 offers; 251 applications |
| Repeated import | No duplicate operational rows |
| Sessions, role escalation and revoked scope | Passed |
| Unauthorized candidate details / invalid interview token | Denied |
| Browser-supplied grade without server evaluation | Denied |
| Offer → joining allocations, missing joining date and edits | Passed |
| Version conflict, audit history, malformed baseline counts | Passed |
| Production activation endpoint | Unavailable |
| Production compiled frontend / unauthenticated API routes | 200 / denied |
| Read-only operational SQLite quick_check | ok |
| Snapshot restored into independent production test process | Integrity ok, 91 demands preserved |
| 100 concurrent health requests | All 200; not representative business load testing |

Tests used separate databases. No real AI requests, email invitations, SAP updates or cloud deployment were performed. Earlier isolated browser smoke tests covered the workflow screen; a full browser regression and mobile/accessibility audit remain unverified.

## Repairs applied

Disabled web activation in production and default demo seeding in production. Restricted candidate details by scope. Prevented candidate ID reassignment between jobs. Required actual joining date even when editing a previously joined candidate. Normalized and constrained vacancy baseline fields. Prevented moving linked demands across access scopes. Made screening-job IDs server-controlled. Corrected India timezone follow-up dates and added follow-up for shared customer profiles. Bound public interview submissions to server-computed assessment and matching transcript; evaluation must be repeated after server restart or expiry. Excluded operational databases, workbook files, documents and environment files from Docker builds and removed bundled live-database copying. Updated compatible dependencies and corrected required Node version to >=22.13.0.

## Remaining launch blockers

1. **Cloud database durability/concurrency:** current SQLite-on-/tmp and whole-file copy to GCS can lose updates across instances/revisions and storage failures. A shared transactional database or a verified single-host persistent disk design is required. Snapshot recovery above does not validate GCS failover or rolling deployments.
2. **Legacy job save concurrency:** bulk replacement can overwrite simultaneous job/candidate edits. Candidate ownership validation prevents reassignment but does not resolve stale saves; add server revisions before production.
3. **Import reconciliation:** 249 issues include missing dates and exact demand links. Workbook source has 8 joined positions while linked demands account for 7; an orphan row has no SOW. Business owners must review these before relying on reports.
4. **Dependencies:** final full audit reports 9 findings: 6 moderate, 3 high, 0 critical. Production-only findings are 5 moderate in the ExcelJS/uuid and Mammoth/argparse/sprintf-js chains. Remaining high findings include development dependencies; major upgrades or removal require compatibility verification. Do not expose the Vite development server publicly.
5. **Interview assessment validation:** invalid AI evaluations now return unavailable instead of a word-count grade. Real-provider success/failure still needs validation. The grade anti-forgery check does not verify candidate identity or truthful proctoring telemetry.
6. **Real integration/UAT:** test actual AI-provider success/failure, resume parsing, invitation delivery, interview recording/permissions, SAP/calendar connectors and required approval roles. Email/calendar/SAP automation is not configured.
7. **Production environment:** deployed HTTPS/cookies, domain/origin policy, secrets management, monitoring, retention, restore drill and service failure handling still require verification. Docker execution was unavailable on this host.
8. **Business rules:** clarify the 30% doable calculation and GM revenue/cost basis; current app cannot safely invent them.

Praveen Ambrose is the designated superuser. Activation state and credentials must be managed by the owner on the local setup screen before deployment; no production password was set by these tests.

## Repeat checks

From the project folder, with Node >=22.13 and dependencies installed:

```powershell
node tests/workflow-rules-test.mjs
node tests/workflow-integration-test.mjs
node tests/release-checks.mjs
npm run build
npm audit --omit=dev
```

Integration tests require the original two workbooks, use ports 8790/8791, and create snapshots/test databases under scratch/release-test. They create test-only passwords inside isolated databases. Operational files and Excel sources are read only by these checks.

