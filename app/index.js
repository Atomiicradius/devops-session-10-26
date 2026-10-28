const express = require("express");
const os = require("os");
const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "v1";

app.get("/", (req, res) => {
  res.send(`<h1>Hello DevOps 👋</h1>
<p>Version: <b>${VERSION}</b></p>
<p>Served by host: <b>${os.hostname()}</b></p>
<p>Time: ${new Date().toISOString()}</p>`);
});

app.get("/health", (req, res) => res.json({ status: "ok", version: VERSION, host: os.hostname() }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`App ${VERSION} listening on port ${PORT}`));
}
module.exports = app;
