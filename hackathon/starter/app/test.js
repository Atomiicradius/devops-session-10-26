// Checks /health only, so the test runs without Redis (CI has no Redis).
const assert = require("assert");
const app = require("./server");
const server = app.listen(0, async () => {
  const res = await fetch(`http://localhost:${server.address().port}/health`);
  assert.strictEqual(res.status, 200, "/health must return 200 (hint: does the route exist yet?)");
  const body = await res.json();
  assert.strictEqual(body.status, "ok");
  console.log("✅ health check passed");
  server.close();
});
