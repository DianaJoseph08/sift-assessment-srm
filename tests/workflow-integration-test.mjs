// Current roles supersede the former Admin-posts-jobs fixture.
process.env.ROLE_TEST_PORT='8790';
await import('./role-workflow-test.mjs');
