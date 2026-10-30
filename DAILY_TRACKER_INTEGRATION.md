# Daily Tracker integration

The source workbook remains unchanged. Open Recruitment Operations → Daily Tracker after signing in.

## Workbook coverage

| Original tab | App implementation |
| --- | --- |
| Open Position Tracker Master | All 39 named columns, editable demand fields, historical allocations, live active/offer/join/hold counts, ageing and scoped totals. Candidate Name / MTSL DOJ source values are retained. |
| Supply Master Data | All 36 columns, including Column1 and Column3–Column10. The original Column1 becomes the normalized full SOW key. Reserved extension columns are retained as editable text. Extra Job ID, email, phone and screening details appear alongside original columns. |
| Dashboard | Current-stage matrix by client manager, active position totals and internal-submission date filters. Source manual counts are recalculated from operational data. |
| DV_DailyTrack | All 16 source column positions and original configuration values are visible to Super Admin; live dropdown directories are shown separately and managed in Access & rules. Blank source columns remain visible. |
| Offered Tracker | All 21 original columns, offer dates, selection, expected/actual joining, TAG lead, PMO, recruiter, package and joining stage. |
| Summary_Bosch | Live SOW/stage matrix, scoped to selected customer/cluster and full SOW ID. Supports all customers; no unreliable last-four-digit matching. |
| Recruiter Vise | Live recruiter/stage matrix with customer, cluster and internal-submission date filters. |

Each row has a stable record ID for edits and history; Excel serial numbers follow the displayed record order. CSV exports preserve every displayed column and guard formula injection. Source unknowns remain blank. Imported missing-SOW/orphan rows remain in the reconciliation queue.

## Automated flow

1. A saved job gets a persistent server reference such as SKODA-EMB-SE-000001; the underlying job ID is preserved. Format: COMPANY-CLUSTER-TITLESHORTFORM-NUMBER. IDs are never reused after deletion and stay fixed after assignment, including later title/name edits. Legacy generic references are retained as aliases; jobs missing a valid customer or cluster keep a temporary JOB-number until corrected. External Position Code/SOW and internal Job ID remain separate.
2. A posted job with a valid customer and cluster creates a linked demand automatically. One vacancy is the initial default; set the actual count in the demand tracker for multiple openings. Jobs with invalid or missing scope are listed with actionable links for correction.
3. A saved resume upload creates one Sourced application for its candidate ID and demand.
4. Successful screening persists the result server-side and fills missing candidate fields. Name, email, experience and education come from screening; extra resume fields are requested explicitly in trackerDetails. Unknown salary, notice period, preferred location, grade and employment type are not invented.
5. Screening advances Sourced to Internal Feedback Pending and stamps the submission date. Later workflow decisions are preserved. Repeated saves do not duplicate the application or overwrite manual edits.
6. Job status updates propagate to auto-created demands. Tracker and customer dashboards refresh every 15 seconds and when the browser regains focus.

## Formula fidelity and limits

Ageing uses India calendar dates; active vacancies equal total minus reserved, joined, hold/cancelled and non-doable allocations. Joined candidates transfer reservations instead of counting twice. Source row-level Doable /Non Doable entries remain separate from the U3 target (active × 30%), which is displayed explicitly as a fractional workbook target. A configured app target remains an independent setting. Actual GM% remains manual because the workbook does not supply a reliable revenue/cost calculation. The malformed AM41 Remarks×12 formula is retained as an import issue rather than fabricated as a challenge description.

The UI can edit all original input columns. Calculated fields and generated IDs are read only. Source configuration is reference-only; operational option changes use Access & rules.

## Validation and operational follow-up

Passed isolated tests: seven tabs, 39/36/21 source-column counts; automatic job/demand/upload/screening linking; stable unique references; repeat-save idempotency; preservation of manual edits and missing values; closure propagation; access isolation; all seven views statically rendered; existing import/workflow regression; customer, chart and browser-history tests; production build.

No paid AI request, email, or cloud deployment was performed during testing. Static rendering is not a full browser interaction test. AI extraction accuracy still needs review against real resumes. Existing production readiness blockers in GO_LIVE_READINESS.md remain applicable, including legacy bulk-save concurrency and cloud database durability.

The operational database was backed up before the upgrade and again before backfill under scratch/tracker-backups. Existing unassigned jobs were not guessed into a customer/cluster. Resolve the warning in Daily Tracker to include them in scoped pipeline reports.

Repeat checks:

```powershell
node tests/tracker-automation-test.mjs
node tests/tracker-ui-test.mjs
node tests/workflow-integration-test.mjs
npm run build
```

