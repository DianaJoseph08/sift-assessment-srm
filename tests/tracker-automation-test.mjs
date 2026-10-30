// Tracker automation is exercised through the full manager/recruiter flow.
process.env.ROLE_TEST_PORT='8792';
await import('./role-workflow-test.mjs');
