// Minimal test: start app, hit /health, assert 200 + status ok. No test framework needed.
const assert = require("assert");
const app = require("./index");
const server = app.listen(0, async () => {
  const port = server.address().port;
  const res = await fetch(`http://localhost:${port}/health`);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, "ok");
  console.log("✅ test passed");
  server.close();
});
