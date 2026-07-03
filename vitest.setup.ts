// Pin the test timezone to Austin's (Central). Node honors a runtime TZ assignment, and setup
// files run before test modules are imported, so all `Date` logic under test sees a west-of-UTC
// zone. This is what makes the AV-1 weekday regression test meaningful (and guards against it
// silently passing only because CI happens to run in UTC).
process.env.TZ = "America/Chicago";
