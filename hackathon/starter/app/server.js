// Crowd Meter: counts visits in Redis and shows which copy of the app served you.
const express = require("express");
const { createClient } = require("redis");
const os = require("os");

const app = express();
const VERSION = process.env.APP_VERSION || "v1";
const GREETING = process.env.GREETING || "Welcome to the canteen";

// TODO(ops): this only works when Redis runs on the same machine as the app.
const redis = createClient({ url: "redis://localhost:6379" });
redis.on("error", (e) => console.error("redis error:", e.message));

app.get("/", async (req, res) => {
  const count = await redis.incr("visits");
  res.send(`<h1>${GREETING}</h1>
<p>Visitors so far: <b>${count}</b></p>
<p>Version: ${VERSION} · served by <b>${os.hostname()}</b></p>`);
});

if (require.main === module) {
  redis.connect().then(() => {
    // TODO(ops): only reachable from inside the machine it runs on.
    app.listen(3000, "127.0.0.1", () => console.log(`crowd-meter ${VERSION} listening on 3000`));
  });
}
module.exports = app;
