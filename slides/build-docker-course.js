const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const si = require("react-icons/si");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2] || "devops-workshop.pptx";

// Colour code (consistent across the whole deck):
//   accent1 blue   = Docker        accent4 violet = Kubernetes
//   accent3 amber  = CI/CD         accent2 teal   = hands-on / labs
//   accent6 green  = good/done     accent5 red    = problem/failure
const THEME = {
  name: "DevOps Workshop",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0F172A", lt1: "FFFFFF", dk2: "475569", lt2: "F1F5F9",
    accent1: "0284C7", accent2: "0D9488", accent3: "D97706",
    accent4: "7C3AED", accent5: "DC2626", accent6: "16A34A",
    hlink: "0284C7", folHlink: "7C3AED",
  },
};
const H = THEME.colors;
const TINT = { docker: "E0F2FE", k8s: "EDE9FE", ci: "FEF3C7", lab: "CCFBF1", good: "DCFCE7", bad: "FEE2E2", grey: "F1F5F9" };

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "DevOps Workshop";
pres.title = "Docker from Zero: a 3-hour course";
const C = pres.SchemeColor;
const MONO = "Courier New";
const TOPIC = {
  docker: { c: C.accent1, hex: H.accent1, tint: TINT.docker, name: "Docker" },
  k8s: { c: C.accent4, hex: H.accent4, tint: TINT.k8s, name: "Kubernetes" },
  ci: { c: C.accent3, hex: H.accent3, tint: TINT.ci, name: "CI/CD" },
  lab: { c: C.accent2, hex: H.accent2, tint: TINT.lab, name: "Hands-on" },
};

// ---------- icons ----------
const iconCache = {};
async function icon(name, hex) {
  const key = name + hex;
  if (iconCache[key]) return iconCache[key];
  const Comp = fa[name] || si[name];
  if (!Comp) throw new Error("no icon " + name);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  iconCache[key] = "image/png;base64," + buf.toString("base64");
  return iconCache[key];
}

// ---------- layouts ----------
const FOOT = { text: "Docker from Zero  ·  containers, images, compose, registries, volumes", options: { x: 0.5, y: 5.2, w: 6, h: 0.3, fontSize: 9, color: H.dk2, margin: 0 } };
pres.defineSlideMaster({
  title: "TITLE", background: { color: H.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.5, w: 8.8, h: 1.3, fontSize: 44, bold: true, color: H.lt1, align: "left", valign: "bottom", margin: 0 } } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 2.9, w: 8.8, h: 1.2, fontSize: 20, color: "CBD5E1", align: "left", valign: "top", margin: 0 } } },
  ],
});
pres.defineSlideMaster({
  title: "SECTION", background: { color: H.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 2.0, w: 8.8, h: 1.0, fontSize: 40, bold: true, color: H.lt1, align: "left", valign: "bottom", margin: 0 } } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.1, w: 8.8, h: 0.9, fontSize: 18, color: "CBD5E1", align: "left", valign: "top", margin: 0 } } },
  ],
});
for (const [name, bg] of [["CONTENT", H.lt1], ["LAB", "F0FDFA"]]) {
  pres.defineSlideMaster({
    title: name, background: { color: bg },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 7.5, h: 0.7, fontSize: 28, bold: true, color: H.dk1, align: "left", valign: "middle", margin: 0 } } },
      { text: FOOT },
    ],
    slideNumber: { x: 9.2, y: 5.2, w: 0.4, h: 0.3, fontSize: 9, color: H.dk2 },
  });
}

// ---------- helpers ----------
let section = "Intro";
const NEUTRAL = { c: C.text1, hex: H.dk1, tint: TINT.grey, name: "Intro" };
let topic = NEUTRAL;
function slide(master, title, notes, sub) {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  if (sub) s.addText(sub, { placeholder: "body" });
  if (notes) s.addNotes(notes);
  if (master === "CONTENT" || master === "LAB") { // topic chip, top right: the colour code in action
    s.addShape(pres.ShapeType.roundRect, { x: 8.2, y: 0.42, w: 1.3, h: 0.36, rectRadius: 0.18, fill: { color: master === "LAB" ? TOPIC.lab.c : topic.c }, line: { color: master === "LAB" ? TOPIC.lab.c : topic.c }, objectName: "topic chip" });
    s.addText(master === "LAB" ? "HANDS-ON" : topic.name.toUpperCase(), { isTextBox: true, x: 8.2, y: 0.42, w: 1.3, h: 0.36, fontSize: 9, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, charSpacing: 1, objectName: "topic chip text" });
  }
  return s;
}
function text(s, str, o) {
  s.addText(str, Object.assign({ isTextBox: true, fontSize: 14, color: C.text1, margin: 0, valign: "top" }, o));
}
function bullets(s, items, o) {
  const arr = items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 6 } }));
  s.addText(arr, Object.assign({ isTextBox: true, fontSize: 14, color: C.text1, margin: 0, valign: "top" }, o));
}
function code(s, str, o) {
  const opts = Object.assign({ x: 0.5, y: 1.2, w: 9, h: 3.6 }, o);
  s.addShape(pres.ShapeType.roundRect, { x: opts.x, y: opts.y, w: opts.w, h: opts.h, rectRadius: 0.1, fill: { color: C.text1 }, line: { color: C.text1 }, objectName: "code bg" });
  s.addText(str, { isTextBox: true, x: opts.x + 0.15, y: opts.y + 0.1, w: opts.w - 0.3, h: opts.h - 0.2, fontFace: MONO, fontSize: opts.fontSize || 12, color: "E2E8F0", margin: 0, valign: "top", objectName: "code" });
}
async function card(s, { x, y, w, h, title, body, ic, color, tint, titleSize, bodySize }) {
  color = color || topic.c;
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: tint || C.background2 }, line: { color: tint || C.background2 }, objectName: title + " card" });
  if (ic) {
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.5, fill: { color }, line: { color }, objectName: title + " circle" });
    s.addImage({ data: await icon(ic, "FFFFFF"), x: x + 0.3, y: y + 0.3, w: 0.3, h: 0.3, objectName: title + " icon" });
  }
  text(s, title, { x: x + (ic ? 0.85 : 0.2), y: y + 0.2, w: w - (ic ? 1.05 : 0.4), h: 0.5, fontSize: titleSize || 16, bold: true, valign: "middle" });
  if (Array.isArray(body)) bullets(s, body, { x: x + 0.2, y: y + 0.85, w: w - 0.4, h: h - 1.0, fontSize: bodySize || 13 });
  else text(s, body, { x: x + 0.2, y: y + 0.85, w: w - 0.4, h: h - 1.0, fontSize: bodySize || 13 });
}
function box(s, { x, y, w, h, t, color, tc, size, bold, dash, font }) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: color || C.background2 }, line: { color: color || C.background2, dashType: dash || "solid" }, objectName: "box " + t });
  s.addText(t, { isTextBox: true, x, y, w, h, fontSize: size || 12, bold: bold || false, color: tc || C.text1, align: "center", valign: "middle", margin: 0.03, fontFace: font, objectName: "box text " + t });
}
function arrow(s, x1, y1, x2, y2, color) {
  s.addShape(pres.ShapeType.line, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: x2 < x1, flipV: y2 < y1, line: { color: color || H.dk2, width: 1.5, endArrowType: "triangle" }, objectName: "arrow" });
}
function labBadge(s, n) {
  s.addShape(pres.ShapeType.roundRect, { x: 6.3, y: 0.42, w: 1.7, h: 0.36, rectRadius: 0.18, fill: { color: TOPIC.lab.tint }, line: { color: TOPIC.lab.tint }, objectName: "time badge" });
  s.addText(n, { isTextBox: true, x: 6.3, y: 0.42, w: 1.7, h: 0.36, fontSize: 11, bold: true, color: TOPIC.lab.c, align: "center", valign: "middle", margin: 0, objectName: "time badge text" });
}
function keyline(s, t, color) { // single takeaway strip at the bottom of a slide
  box(s, { x: 0.5, y: 4.45, w: 9, h: 0.55, t, color: color || topic.c, tc: C.background1, size: 14, bold: true });
}
function stepRow(s, steps, { y, color, tint, h, size }) { // horizontal numbered flow in section colour
  const n = steps.length, gap = 0.22, w = (9 - gap * (n - 1)) / n;
  steps.forEach((t, i) => {
    const x = 0.5 + i * (w + gap);
    box(s, { x, y, w, h: h || 0.9, t, color: i === 0 ? color : tint, tc: i === 0 ? C.background1 : C.text1, size: size || 12, bold: true });
    if (i < n - 1) arrow(s, x + w, y + (h || 0.9) / 2, x + w + gap, y + (h || 0.9) / 2, color);
  });
}
async function labSlide(title, notes, file, steps, done, stuck, mins) {
  const s = slide("LAB", title, notes);
  labBadge(s, mins);
  text(s, "Open  " + file + "  in your Codespace and mirror the instructor", { x: 0.5, y: 1.1, w: 9, h: 0.4, fontSize: 15, bold: true, color: TOPIC.lab.c });
  const pitch = Math.min(0.47, 3.4 / steps.length);
  steps.forEach((t, i) => { box(s, { x: 0.5, y: 1.6 + i * pitch, w: 0.4, h: pitch - 0.09, t: String(i + 1), color: TOPIC.lab.c, tc: C.background1, bold: true, size: 12 }); text(s, t, { x: 1.05, y: 1.6 + i * pitch, w: 4.6, h: pitch - 0.09, fontSize: 14, valign: "middle" }); });
  await card(s, { x: 6.0, y: 1.6, w: 3.5, h: 1.35, title: "Done when", body: done, ic: "FaCheck", color: C.accent6, tint: TINT.good, bodySize: 12 });
  await card(s, { x: 6.0, y: 3.1, w: 3.5, h: 1.9, title: "Stuck?", body: stuck, ic: "FaLifeRing", color: C.accent5, tint: TINT.bad, bodySize: 12 });
  return s;
}
async function quiz(title, qs, notes) {
  const s = slide("CONTENT", title, "Answers (also in notes): " + notes + "\nAsk the room, wait, then reveal verbally. 2 minutes max.");
  text(s, "Say the answer out loud before the instructor does", { x: 0.5, y: 1.1, w: 9, h: 0.35, fontSize: 13, italic: true, color: C.text2 });
  for (let i = 0; i < qs.length; i++) {
    const y = 1.55 + i * 0.95;
    s.addShape(pres.ShapeType.ellipse, { x: 0.5, y: y + 0.12, w: 0.55, h: 0.55, fill: { color: topic.c }, line: { color: topic.c }, objectName: "q circle " + i });
    text(s, "Q" + (i + 1), { x: 0.5, y: y + 0.12, w: 0.55, h: 0.55, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
    s.addShape(pres.ShapeType.roundRect, { x: 1.25, y, w: 8.25, h: 0.8, rectRadius: 0.1, fill: { color: topic.tint }, line: { color: topic.tint }, objectName: "q box " + i });
    text(s, qs[i], { x: 1.45, y, w: 7.9, h: 0.8, fontSize: 15, valign: "middle" });
  }
  return s;
}
async function recap(title, items, notes) {
  const s = slide("CONTENT", title, notes);
  for (let i = 0; i < items.length; i++) {
    const y = 1.2 + i * 1.25;
    s.addShape(pres.ShapeType.roundRect, { x: 0.5, y, w: 9, h: 1.1, rectRadius: 0.12, fill: { color: topic.tint }, line: { color: topic.tint }, objectName: "recap " + i });
    s.addShape(pres.ShapeType.ellipse, { x: 0.7, y: y + 0.3, w: 0.5, h: 0.5, fill: { color: topic.c }, line: { color: topic.c }, objectName: "recap circle " + i });
    s.addImage({ data: await icon(items[i][2], "FFFFFF"), x: 0.8, y: y + 0.4, w: 0.3, h: 0.3, objectName: "recap icon " + i });
    text(s, items[i][0], { x: 1.4, y: y + 0.12, w: 7.9, h: 0.4, fontSize: 15, bold: true, valign: "middle" });
    text(s, items[i][1], { x: 1.4, y: y + 0.55, w: 7.9, h: 0.5, fontSize: 12, color: C.text2, valign: "top" });
  }
  return s;
}

(async () => {
  const D = TOPIC.docker;
  // ================= 0. INTRO =================
  pres.addSection({ title: "Intro" }); section = "Intro"; topic = NEUTRAL;
  let s = slide("TITLE", "Docker from Zero", "0:00 Intro and course overview. Say who it's for: anyone who can run a terminal. By the end you'll containerise a real app (Node + MongoDB), push it to a private registry, deploy it, and persist its data.", "A 3-hour course · what Docker is, why it exists, and how to use it for a real multi-service app");
  s.addImage({ data: await icon("FaDocker", H.accent1), x: 8.2, y: 0.7, w: 1.1, h: 1.1, objectName: "docker icon" });
  box(s, { x: 0.6, y: 4.3, w: 8.8, h: 0.6, t: "Structure based on 'Docker Tutorial for Beginners' by TechWorld with Nana  ·  demo project: Node app + MongoDB + Mongo Express", color: "1E293B", tc: "E2E8F0", size: 12 });

  s = slide("CONTENT", "Course overview", "Walk the 15 sections. Three arcs: 1 concepts (what/why), 2 daily use (commands, debugging, developing with containers, compose), 3 shipping (Dockerfile, registry, deploy, volumes).");
  const arcs = [["1 · Understand", ["What is Docker?", "What is a container?", "Docker vs virtual machine", "Installation"], "FaLightbulb"], ["2 · Use daily", ["Main commands", "Debugging a container", "Developing with containers", "Docker Compose"], "FaTerminal"], ["3 · Ship it", ["Dockerfile: build your own image", "Private registry (AWS ECR)", "Deploy the containerised app", "Volumes: persist data"], "FaShip"]];
  for (let i = 0; i < 3; i++) await card(s, { x: 0.5 + i * 3.07, y: 1.2, w: 2.85, h: 3.1, title: arcs[i][0], body: arcs[i][1], ic: arcs[i][2], color: D.c, tint: D.tint });
  keyline(s, "One demo project runs through the whole course: a Node.js app that talks to MongoDB, with Mongo Express as admin UI.", C.text1);

  // ================= 1. WHAT IS DOCKER =================
  section = "What is Docker"; topic = D; pres.addSection({ title: section });
  s = slide("SECTION", "1 · What is Docker?", "01:58. Definition first, then the two problems it solves: development setup and deployment.", "A platform for packaging, distributing and running applications in containers");
  s.addImage({ data: await icon("FaDocker", H.accent1), x: 7.8, y: 1.6, w: 1.5, h: 1.5, objectName: "docker icon" });

  s = slide("CONTENT", "Docker in one sentence", "Docker = a tool that packages an application with ALL its dependencies into a standard unit (a container) that runs the same way on any machine. The company Docker Inc. made the tool; 'docker' is also the CLI; the format became the open OCI standard.");
  box(s, { x: 0.5, y: 1.25, w: 9, h: 1.0, t: "Docker packages an application together with everything it needs to run, so it behaves identically on any machine.", color: D.c, tc: C.background1, size: 17, bold: true });
  await card(s, { x: 0.5, y: 2.5, w: 4.4, h: 2.4, title: "The application", body: ["Your code (JS, Python, Java…)", "The runtime (Node 20, Python 3.12)", "Libraries and packages", "Config and environment variables"], ic: "FaCode" });
  await card(s, { x: 5.1, y: 2.5, w: 4.4, h: 2.4, title: "Everything it needs", body: ["The OS layer it expects (Debian, Alpine)", "System libraries (OpenSSL, libc)", "Tools and binaries", "All frozen into one artefact: the image"], ic: "FaBoxOpen" });

  s = slide("CONTENT", "Problem 1: development before containers", "Nana's story: a team of 10 installing PostgreSQL, Redis, Node on 10 laptops, different OSes, 20 steps each, something breaks on each one. Then a new dev joins and you do it again.");
  stepRow(s, ["Read the setup wiki\n(out of date)", "Install Postgres,\nRedis, Node…", "Different steps\nfor Mac / Win / Linux", "Something fails\non step 14", "Ask a colleague\nhalf a day gone"], { y: 1.3, color: C.accent5, tint: TINT.bad, h: 1.0, size: 11 });
  text(s, "With containers:", { x: 0.5, y: 2.6, w: 9, h: 0.3, fontSize: 14, bold: true, color: D.c });
  stepRow(s, ["Install Docker\n(once)", "docker run postgres\ndocker run redis", "Same command on\nevery OS", "Isolated: no clash with\nwhat's already installed", "New dev productive\nin 10 minutes"], { y: 2.95, color: D.c, tint: D.tint, h: 1.0, size: 11 });
  keyline(s, "Services become one command each. No installation, no OS-specific steps, no version conflicts.");

  s = slide("CONTENT", "Problem 2: deployment before containers", "Dev hands a jar/zip + a text file of instructions to Ops. Ops installs the runtime, mis-reads a step, versions differ, 'it works on my machine'. Back-and-forth for days. With containers Dev ships an image that already contains the runtime and config; Ops runs one command.");
  text(s, "Before", { x: 0.5, y: 1.15, w: 4.3, h: 0.3, fontSize: 14, bold: true, color: C.accent5 });
  box(s, { x: 0.5, y: 1.5, w: 1.9, h: 1.1, t: "Developers\napp artefact +\nsetup instructions", color: TINT.bad, size: 11, bold: true });
  arrow(s, 2.4, 2.05, 2.9, 2.05, C.accent5);
  box(s, { x: 2.9, y: 1.5, w: 1.9, h: 1.1, t: "Operations\ninstall runtime, configure,\nhope it matches", color: TINT.bad, size: 11, bold: true });
  bullets(s, ["Instructions misread or out of date", "Different runtime versions on the server", "Dependency conflicts with other apps", "Errors found only in production"], { x: 0.5, y: 2.8, w: 4.3, h: 1.5, fontSize: 12 });
  text(s, "After", { x: 5.2, y: 1.15, w: 4.3, h: 0.3, fontSize: 14, bold: true, color: D.c });
  box(s, { x: 5.2, y: 1.5, w: 1.9, h: 1.1, t: "Developers\nbuild an image:\napp + runtime + config", color: D.c, tc: C.background1, size: 11, bold: true });
  arrow(s, 7.1, 2.05, 7.6, 2.05, D.c);
  box(s, { x: 7.6, y: 1.5, w: 1.9, h: 1.1, t: "Operations\ndocker run image\n(plus the platform)", color: D.c, tc: C.background1, size: 11, bold: true });
  bullets(s, ["Nothing to install except Docker", "Exact same artefact dev tested", "Isolated from other apps on the server", "Same image in test, staging, production"], { x: 5.2, y: 2.8, w: 4.3, h: 1.5, fontSize: 12 });
  keyline(s, "The image becomes the contract between Dev and Ops. That's the origin of 'DevOps' tooling.");

  // ================= 2. WHAT IS A CONTAINER =================
  section = "What is a container"; pres.addSection({ title: section });
  s = slide("SECTION", "2 · What is a container?", "10:56. Container = layers of images; a running image. Show Docker Hub. Show 'docker run postgres:9.6' pulling layers.", "A running package of an application: image layers + a process");

  s = slide("CONTENT", "Images are stacks of layers", "Bottom: a small Linux base (Alpine, Debian slim). Middle: runtime + libraries. Top: the application. Each layer is read-only and shared between images that use it. Pulling 'postgres:9.6' then 'postgres:10' downloads only the layers that differ.");
  const stack = [["Application layer: your app + config", D.c, C.background1], ["Runtime: Node 20 / Python / JDK", "38BDF8", C.text1], ["Libraries: OpenSSL, libc, tools", "7DD3FC", C.text1], ["Base OS layer: Alpine or Debian (no kernel)", "BAE6FD", C.text1]];
  stack.forEach(([t, c, tc], i) => box(s, { x: 0.6, y: 1.3 + i * 0.75, w: 4.6, h: 0.65, t, color: c, tc, size: 13, bold: true }));
  text(s, "↑ most specific, changes most", { x: 0.6, y: 4.35, w: 4.6, h: 0.3, fontSize: 10, color: C.text2, italic: true });
  await card(s, { x: 5.6, y: 1.3, w: 3.9, h: 3.4, title: "Why layers", body: ["Small base images: Alpine is ~5 MB", "Shared: 10 Node images store the base once", "Fast pulls: only missing layers download", "Immutable: a layer never changes after build", "A container adds one thin writable layer on top"], ic: "FaLayerGroup" });

  s = slide("CONTENT", "Image vs container", "Image = the package (static, on disk or in a registry). Container = the image started: a process, with its own filesystem (image layers + writable layer), its own network, its own hostname. 'docker run image' creates a container. One image, many containers.");
  await card(s, { x: 0.5, y: 1.2, w: 4.4, h: 2.9, title: "Image", body: ["A file artefact: layers + metadata", "Not running. Can't 'crash'", "Lives in a registry or local cache", "Versioned by tag: postgres:16", "Like a class, or an installer"], ic: "FaLayerGroup" });
  await card(s, { x: 5.1, y: 1.2, w: 4.4, h: 2.9, title: "Container", body: ["The image, started: a process with isolation", "Own filesystem view, network, hostname, port space", "Has a state: created, running, exited", "Many containers from one image", "Like an object, or an installed+running app"], ic: "FaCube" });
  keyline(s, "docker pull  fetches an image.   docker run  turns an image into a container.");

  s = slide("CONTENT", "Docker Hub: the public image library", "hub.docker.com. Official images (postgres, redis, mongo, node, nginx) are maintained by Docker + the upstream project. Tags = versions. 'latest' is just the default tag, not 'newest'. Show the page for mongo and the tag list. Demo: docker run postgres:9.6 then postgres:10, watch the shared layers say 'Already exists'.");
  box(s, { x: 0.5, y: 1.2, w: 9, h: 0.55, t: "docker run postgres:9.6        # pulls image if missing, then starts it", color: C.text1, tc: "E2E8F0", size: 12, bold: true, font: MONO });
  code(s, "Unable to find image 'postgres:9.6' locally\n9.6: Pulling from library/postgres\nf7e2b70d04ae: Pull complete        ← base layer\n0a5ac6b4e5e5: Pull complete        ← libraries\n8d3b1e0d4b7a: Pull complete        ← postgres binaries\n...\nStatus: Downloaded newer image for postgres:9.6\nPostgreSQL init process complete; ready for start up.", { x: 0.5, y: 1.9, w: 5.4, h: 2.4, fontSize: 10 });
  await card(s, { x: 6.1, y: 1.9, w: 3.4, h: 2.4, title: "Image names", body: ["name:tag  →  postgres:9.6", "no tag  →  :latest", "user/name  →  nana/my-app", "registry/user/name:tag  →  private"], ic: "FaTag" });
  keyline(s, "Pull postgres:10 next: shared layers print 'Already exists'. Only the difference downloads.");

  // ================= 3. DOCKER VS VM =================
  section = "Docker vs VM"; pres.addSection({ title: section });
  s = slide("SECTION", "3 · Docker vs virtual machine", "19:40. OS = kernel + applications layer. Docker virtualises the applications layer, a VM virtualises the kernel too.", "Which part of the operating system gets virtualised?");

  s = slide("CONTENT", "An OS has two layers; Docker virtualises only one", "Any OS = kernel (talks to hardware) + applications layer (shell, package manager, libraries, UI). A VM image contains both: its own kernel, boots like a computer, GBs, minutes. A Docker image contains only the applications layer and uses the HOST's kernel: MBs, seconds. Consequence: a Linux container needs a Linux kernel; on Mac/Windows Docker Desktop runs a tiny Linux VM to provide one.");
  text(s, "Virtual machine", { x: 0.5, y: 1.15, w: 4.2, h: 0.35, fontSize: 15, bold: true });
  [["Applications layer", C.background2], ["Guest OS kernel", "CBD5E1"]].forEach(([t, c], i) => box(s, { x: 0.6, y: 1.55 + i * 0.5, w: 4.0, h: 0.45, t, color: c, size: 12 }));
  box(s, { x: 0.6, y: 2.55, w: 4.0, h: 0.45, t: "Hypervisor", color: C.text2, tc: C.background1, size: 12, bold: true });
  box(s, { x: 0.6, y: 3.05, w: 4.0, h: 0.45, t: "Host kernel · Hardware", color: C.text1, tc: C.background1, size: 12 });
  bullets(s, ["Image = GBs, boots in minutes", "Any OS inside any host", "Strong isolation"], { x: 0.6, y: 3.65, w: 4.0, h: 1.2, fontSize: 12 });
  text(s, "Docker container", { x: 5.3, y: 1.15, w: 4.2, h: 0.35, fontSize: 15, bold: true, color: D.c });
  box(s, { x: 5.4, y: 1.55, w: 4.0, h: 0.45, t: "Applications layer only", color: D.tint, size: 12, bold: true });
  box(s, { x: 5.4, y: 2.05, w: 4.0, h: 0.95, t: "(no kernel in the image)", color: "FFFFFF", size: 11, dash: "dash" });
  box(s, { x: 5.4, y: 3.05, w: 4.0, h: 0.45, t: "Host kernel (shared) · Hardware", color: D.c, tc: C.background1, size: 12, bold: true });
  bullets(s, ["Image = MBs, starts in seconds", "Linux containers need a Linux kernel", "On Mac / Windows: Docker Desktop ships a small Linux VM to supply it"], { x: 5.4, y: 3.65, w: 4.0, h: 1.3, fontSize: 12 });

  s = slide("CONTENT", "Side by side", "Quick comparison table; then the compatibility caveat: older Windows (Home before WSL2) couldn't run Docker natively; now WSL2 handles it.");
  const cmp = [["", "Virtual machine", "Docker container"], ["Virtualises", "Kernel + applications layer", "Applications layer only"], ["Image size", "Gigabytes", "Megabytes"], ["Start time", "Minutes", "Seconds or less"], ["Compatibility", "Any OS on any host", "Linux images need a Linux kernel (Docker Desktop provides one)"], ["Isolation", "Hardware-level", "Process-level (namespaces, cgroups)"], ["Typical use", "Run a whole OS; strong tenancy boundaries", "Package and run one application"]];
  s.addTable(cmp.map((r, ri) => r.map((c, ci) => ({ text: c, options: { bold: ri === 0 || ci === 0, fontSize: 12, color: ri === 0 ? H.lt1 : H.dk1, fill: { color: ri === 0 ? H.dk1 : "FFFFFF" } } }))), { x: 0.5, y: 1.2, w: 9, colW: [1.7, 3.4, 3.9], rowH: 0.45, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, margin: 0.06, valign: "middle", objectName: "vm table" });
  keyline(s, "They're complementary: in the cloud, your containers usually run on VMs.");

  // ================= 4. INSTALLATION =================
  section = "Installation"; pres.addSection({ title: section });
  s = slide("SECTION", "4 · Installing Docker", "23:53. Docker Desktop for Mac/Windows, Docker Engine for Linux. Check requirements. Then 'docker run hello-world'.", "Docker Desktop on Mac and Windows, Docker Engine on Linux");

  s = slide("CONTENT", "Install, then verify", "docs.docker.com/get-docker. Mac: Docker Desktop (Apple or Intel chip). Windows: Docker Desktop, needs WSL2 enabled (Windows 10 2004+ / 11). Linux: Docker Engine via apt/dnf; add your user to the docker group to skip sudo. Verify with docker --version and docker run hello-world, which pulls a tiny image and prints a message: proves the daemon, the pull path and the run path all work.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 2.3, title: "macOS", body: ["Docker Desktop (.dmg)", "Pick Apple silicon or Intel", "Includes the Linux VM, CLI, Compose"], ic: "FaApple" });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 2.3, title: "Windows", body: ["Docker Desktop (.exe)", "Needs WSL 2 enabled", "Windows 10 2004+ or 11"], ic: "FaWindows" });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 2.3, title: "Linux", body: ["Docker Engine via apt / dnf", "sudo usermod -aG docker $USER", "Log out and back in"], ic: "FaLinux" });
  code(s, "docker --version          # client version\ndocker run hello-world    # pulls a tiny image, runs it, prints 'Hello from Docker!'\ndocker ps                 # talks to the daemon: an empty table means all good", { x: 0.5, y: 3.7, w: 9, h: 1.2, fontSize: 11 });

  s = slide("CONTENT", "What got installed: client, daemon, and friends", "The docker CLI is a client. The Docker daemon (dockerd) does the real work: builds, runs, pulls. They talk over a Unix socket (or TCP). Docker Desktop also bundles Compose, and a GUI. 'Cannot connect to the Docker daemon' means the daemon isn't running.");
  box(s, { x: 0.5, y: 1.5, w: 2.2, h: 1.1, t: "docker CLI\n(client)", color: D.tint, size: 12, bold: true });
  arrow(s, 2.7, 2.05, 3.4, 2.05, D.c); text(s, "REST API over\na unix socket", { x: 2.45, y: 2.2, w: 1.2, h: 0.5, fontSize: 8, color: C.text2, align: "center" });
  box(s, { x: 3.4, y: 1.5, w: 2.6, h: 1.1, t: "Docker daemon (dockerd)\nbuilds · runs · pulls · networks", color: D.c, tc: C.background1, size: 12, bold: true });
  arrow(s, 6.0, 2.05, 6.7, 2.05, D.c);
  box(s, { x: 6.7, y: 1.3, w: 2.8, h: 0.6, t: "containers (processes)", color: D.tint, size: 11, bold: true });
  box(s, { x: 6.7, y: 2.0, w: 2.8, h: 0.6, t: "images (local cache)", color: D.tint, size: 11, bold: true });
  arrow(s, 4.7, 2.6, 4.7, 3.1, D.c);
  box(s, { x: 3.4, y: 3.1, w: 2.6, h: 0.6, t: "Docker Hub / registries", color: C.text1, tc: C.background1, size: 11, bold: true });
  bullets(s, ["Docker Desktop also installs Docker Compose and a dashboard GUI", "\"Cannot connect to the Docker daemon\" = the daemon isn't running: start Docker Desktop / systemctl start docker", "Everything the CLI can do, the GUI can do; we'll use the CLI because it's scriptable"], { x: 0.5, y: 3.9, w: 9, h: 1.1, fontSize: 12 });

  // ================= 5. MAIN COMMANDS =================
  section = "Main commands"; pres.addSection({ title: section });
  s = slide("SECTION", "5 · Main Docker commands", "42:02. Demo with redis: pull, run, ps, stop, start, run -d, -p port binding, naming. Explain the difference between image commands and container commands.", "pull · run · ps · stop · start · -d · -p · --name");

  s = slide("CONTENT", "Image commands vs container commands", "Two families. Image family manages the local cache (what you downloaded/built). Container family manages running instances. 'docker run' bridges them: it pulls if needed, then creates and starts a container.");
  await card(s, { x: 0.5, y: 1.2, w: 4.4, h: 3.0, title: "Images", body: ["docker pull redis:7     fetch from registry", "docker images           list local images", "docker rmi redis:7      delete an image", "docker build -t …       make one (section 9)"], ic: "FaLayerGroup" });
  await card(s, { x: 5.1, y: 1.2, w: 4.4, h: 3.0, title: "Containers", body: ["docker run redis:7      create + start", "docker ps  /  ps -a     running / all", "docker stop <id|name>   graceful stop", "docker start <id|name>  restart a stopped one", "docker rm <id|name>     delete a stopped one"], ic: "FaCube" });
  keyline(s, "docker run = (pull if missing) + create + start. Every run makes a NEW container; docker start re-uses an old one.");

  s = slide("CONTENT", "The flags you use every day", "Demo order from the course: docker run redis (blocks the terminal) → Ctrl+C → docker run -d redis → docker ps shows a random name → docker run -d --name my-redis redis → stop/start by name → need port? docker run -d -p 6000:6379 redis → two redis on different host ports.");
  const flags = [["-d", "Detached: run in the background, return the container ID"], ["-p 6000:6379", "Publish: host port 6000 → container port 6379. Left = you, right = app"], ["--name my-redis", "Human name instead of a random one. Must be unique"], ["-e KEY=value", "Set an environment variable inside the container"], ["-it", "Interactive terminal, e.g.  docker run -it ubuntu bash"], ["--rm", "Delete the container automatically when it exits"], ["-v host:container", "Mount a volume (section 12)"], ["--network name", "Attach to a Docker network (section 7)"]];
  s.addTable(flags.map(r => [{ text: r[0], options: { fontFace: MONO, fontSize: 11, bold: true, color: H.dk1 } }, { text: r[1], options: { fontSize: 12, color: H.dk2 } }]), { x: 0.5, y: 1.2, w: 9, colW: [2.2, 6.8], rowH: 0.42, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, fill: { color: "FFFFFF" }, margin: 0.06, valign: "middle", objectName: "flags table" });

  s = slide("CONTENT", "Port binding: why two redis containers don't clash", "Each container has its own network namespace, so both redis listen on 'their' 6379. Only when you publish to the host do ports have to be unique: 6000 and 6001. Without -p the container is reachable only from other containers.");
  box(s, { x: 0.5, y: 1.4, w: 1.9, h: 1.0, t: "Your laptop\nlocalhost", color: TINT.grey, size: 12, bold: true });
  box(s, { x: 3.1, y: 1.2, w: 1.6, h: 0.6, t: "host :6000", color: D.tint, size: 11, bold: true });
  box(s, { x: 3.1, y: 2.0, w: 1.6, h: 0.6, t: "host :6001", color: D.tint, size: 11, bold: true });
  arrow(s, 2.4, 1.6, 3.1, 1.5, D.c); arrow(s, 2.4, 2.2, 3.1, 2.3, D.c);
  box(s, { x: 5.4, y: 1.2, w: 4.1, h: 0.6, t: "container redis-1 · listening on :6379", color: D.c, tc: C.background1, size: 11, bold: true });
  box(s, { x: 5.4, y: 2.0, w: 4.1, h: 0.6, t: "container redis-2 · listening on :6379", color: D.c, tc: C.background1, size: 11, bold: true });
  arrow(s, 4.7, 1.5, 5.4, 1.5, D.c); arrow(s, 4.7, 2.3, 5.4, 2.3, D.c);
  code(s, "docker run -d --name redis-1 -p 6000:6379 redis:7\ndocker run -d --name redis-2 -p 6001:6379 redis:7\ndocker ps        # PORTS column: 0.0.0.0:6000->6379/tcp  and  0.0.0.0:6001->6379/tcp", { x: 0.5, y: 2.95, w: 9, h: 1.0, fontSize: 11 });
  keyline(s, "-p HOST:CONTAINER.  Host ports must be unique; container ports don't care.");

  // ================= 6. DEBUGGING =================
  section = "Debugging"; pres.addSection({ title: section });
  s = slide("SECTION", "6 · Debugging a container", "57:15. logs, exec -it, and the mental model: a container is a tiny Linux you can walk into.", "logs · exec · inspect");

  s = slide("CONTENT", "Three commands that answer 'what is going on in there?'", "docker logs = stdout/stderr of the main process; -f follows. docker exec -it <c> /bin/bash (or sh on Alpine) opens a shell inside: check env, files, processes, curl localhost. docker inspect dumps the full config JSON: IP, mounts, env. Show: cd /, ls, env, exit. Note: 'exit' leaves the shell; the container keeps running because its main process is redis, not your shell.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 2.9, title: "docker logs", body: ["What the main process printed", "docker logs -f c  → follow live", "docker logs --tail 50 c", "Works on stopped containers too"], ic: "FaFileAlt" });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 2.9, title: "docker exec -it", body: ["docker exec -it c /bin/bash", "Alpine images: use  sh", "ls, env, ps, cat config files", "exit  leaves the shell; the container keeps running"], ic: "FaTerminal" });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 2.9, title: "docker inspect", body: ["Full JSON of the container", "IP address, mounts, env, ports", "docker inspect c | grep IPAddress", "docker stats  for CPU / memory live"], ic: "FaSearch" });
  keyline(s, "A container is a tiny Linux you can walk into. Nothing is hidden; there's just no SSH, because you don't need it.");

  s = slide("CONTENT", "Container names, IDs and cleanup", "Every container has a 64-char ID; the first few chars are enough. Names from --name. 'docker ps -a' shows exited ones; they pile up. docker rm removes; docker container prune removes all stopped; docker system prune also removes unused images/networks. Each 'docker run' without --rm leaves a container behind, which is why people end up with 40 exited containers.");
  code(s, "$ docker ps -a\nCONTAINER ID   IMAGE     COMMAND                  STATUS                    PORTS                    NAMES\n3f1a9c2b7d6e   redis:7   \"docker-entrypoint.s…\"   Up 2 minutes              0.0.0.0:6000->6379/tcp   redis-1\n8b2c4d1e9f0a   redis:7   \"docker-entrypoint.s…\"   Exited (0) 10 minutes ago                          brave_lamport\n\n$ docker rm 8b2c                       # first chars of the ID are enough\n$ docker container prune               # remove ALL stopped containers\n$ docker system prune                  # also unused images, networks, build cache", { x: 0.5, y: 1.2, w: 9, h: 2.6, fontSize: 10 });
  bullets(s, ["Random names (brave_lamport) are what you get without --name", "STATUS tells you whether it's up or how it exited: Exited (1) = the process failed, read its logs", "Use --rm for throw-away containers so they clean up after themselves"], { x: 0.5, y: 4.0, w: 9, h: 1.0, fontSize: 12 });

  // ================= 7. DEMO PROJECT + DEVELOPING =================
  section = "Developing with containers"; pres.addSection({ title: section });
  s = slide("SECTION", "7 · The demo project: Docker in practice", "1:06:39 Demo project overview. A JavaScript app (Node + simple HTML form) that stores a user profile in MongoDB; Mongo Express as admin UI. Workflow of the rest of the course: develop locally with containers → CI builds an image → push to private registry → deploy on a server → persist data with volumes.", "A Node.js app · MongoDB · Mongo Express");

  s = slide("CONTENT", "The workflow we'll build, end to end", "This is the roadmap for sections 8–14. Local dev uses containers for the services the app needs (Mongo, Mongo Express). Then the app itself becomes an image, goes through a registry, and runs on a server alongside the same Mongo, with a volume for persistence.");
  stepRow(s, ["Develop locally\napp runs with node;\nMongo + Mongo Express\nin containers", "Commit to git\nCI (Jenkins) builds\na Docker image", "Push the image\nto a private\nregistry (AWS ECR)", "Deploy\nserver pulls image,\ndocker compose up", "Persist\nvolume for\nMongo data"], { y: 1.4, color: D.c, tint: D.tint, h: 1.5, size: 11 });
  text(s, "sections 7–8", { x: 0.5, y: 2.95, w: 1.7, h: 0.3, fontSize: 10, color: C.text2, align: "center" });
  text(s, "section 9", { x: 2.35, y: 2.95, w: 1.7, h: 0.3, fontSize: 10, color: C.text2, align: "center" });
  text(s, "section 10", { x: 4.2, y: 2.95, w: 1.7, h: 0.3, fontSize: 10, color: C.text2, align: "center" });
  text(s, "section 11", { x: 6.05, y: 2.95, w: 1.7, h: 0.3, fontSize: 10, color: C.text2, align: "center" });
  text(s, "section 12", { x: 7.9, y: 2.95, w: 1.6, h: 0.3, fontSize: 10, color: C.text2, align: "center" });
  await card(s, { x: 0.5, y: 3.4, w: 9, h: 1.5, title: "The app", body: "Express server on port 3000 serving an HTML profile page. Saving the form writes a document to MongoDB (database user-account, collection users). Mongo Express on port 8081 lets you browse that data in the browser.", ic: "FaUser" });

  s = slide("CONTENT", "Docker network: containers find each other by name", "1:10:08 Developing with containers. Create a network: docker network create mongo-network. Run mongo and mongo-express on it. Containers on the same user-defined network resolve each other by container NAME (mongodb) via Docker's built-in DNS, no IPs needed. The app running on the host (node server.js) talks to Mongo via localhost:27017 thanks to -p.");
  s.addShape(pres.ShapeType.roundRect, { x: 3.4, y: 1.2, w: 6.1, h: 2.3, rectRadius: 0.1, fill: { color: D.tint }, line: { color: D.tint }, objectName: "network box" });
  text(s, "docker network: mongo-network", { x: 3.55, y: 1.27, w: 5.8, h: 0.3, fontSize: 12, bold: true, color: D.c });
  box(s, { x: 3.6, y: 1.7, w: 2.7, h: 1.2, t: "mongodb\nmongo:7\n:27017", color: D.c, tc: C.background1, size: 12, bold: true });
  box(s, { x: 6.6, y: 1.7, w: 2.7, h: 1.2, t: "mongo-express\nmongo-express\n:8081", color: D.c, tc: C.background1, size: 12, bold: true });
  arrow(s, 6.6, 2.3, 6.3, 2.3, D.c); text(s, "ME_CONFIG_MONGODB_SERVER=mongodb  (by name!)", { x: 3.6, y: 3.0, w: 5.7, h: 0.3, fontSize: 10, fontFace: MONO, color: D.c, align: "center" });
  box(s, { x: 0.5, y: 1.4, w: 2.4, h: 1.0, t: "Node app\nnode server.js\non the host :3000", color: TINT.grey, size: 11, bold: true });
  arrow(s, 2.9, 1.9, 3.6, 2.1, D.c); text(s, "localhost:27017\n(via -p)", { x: 2.6, y: 2.4, w: 1.2, h: 0.5, fontSize: 8, color: C.text2, align: "center" });
  box(s, { x: 0.5, y: 2.7, w: 2.4, h: 0.8, t: "Browser\n:3000 app · :8081 admin", color: TINT.grey, size: 11, bold: true });
  code(s, "docker network create mongo-network\ndocker run -d --name mongodb --network mongo-network -p 27017:27017 \\\n  -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo:7\ndocker run -d --name mongo-express --network mongo-network -p 8081:8081 \\\n  -e ME_CONFIG_MONGODB_SERVER=mongodb \\\n  -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin -e ME_CONFIG_MONGODB_ADMINPASSWORD=password mongo-express", { x: 0.5, y: 3.65, w: 9, h: 1.35, fontSize: 8.5 });

  s = slide("CONTENT", "Connecting the app: the connection string", "In server.js the Mongo URL is mongodb://admin:password@localhost:27017 while the app runs on the host. Later, when the app itself is a container on the same network, 'localhost' becomes 'mongodb'. This single change trips everyone up: localhost inside a container means THAT container.");
  code(s, "// server.js (running on the host during development)\nconst MongoClient = require(\"mongodb\").MongoClient;\nconst mongoUrl = \"mongodb://admin:password@localhost:27017\";\n\napp.post(\"/update-profile\", async (req, res) => {\n  const client = await MongoClient.connect(mongoUrl);\n  const db = client.db(\"user-account\");\n  await db.collection(\"users\").updateOne({ userid: 1 }, { $set: req.body }, { upsert: true });\n  res.send(req.body);\n});", { x: 0.5, y: 1.2, w: 5.6, h: 3.0, fontSize: 9 });
  await card(s, { x: 6.3, y: 1.2, w: 3.2, h: 3.0, title: "Where is 'localhost'?", body: ["App on host → localhost = your machine → Mongo via -p 27017", "App in a container → localhost = that container → Mongo NOT there", "Fix: use the container name on a shared network: mongodb:27017", "Better: read the host from an env var"], ic: "FaExclamationTriangle", color: C.accent5, tint: TINT.bad });
  keyline(s, "Rule: inside a container, 'localhost' is the container itself. Use service names.");

  // ================= 8. COMPOSE =================
  section = "Docker Compose"; pres.addSection({ title: section });
  s = slide("SECTION", "8 · Docker Compose: running multiple services", "1:29:49. Those two long 'docker run' commands become one YAML file. Compose creates the network automatically.", "One YAML file instead of many docker run commands");

  s = slide("CONTENT", "From docker run to docker-compose.yaml", "Map each flag to a YAML key: image → image, --name → service name (and container_name), -p → ports, -e → environment, --network → not needed: Compose creates one network per project and puts all services on it, resolvable by service name. depends_on orders startup (but doesn't wait for readiness).");
  code(s, "# docker-compose.yaml\nservices:\n  mongodb:\n    image: mongo:7\n    ports:\n      - 27017:27017\n    environment:\n      - MONGO_INITDB_ROOT_USERNAME=admin\n      - MONGO_INITDB_ROOT_PASSWORD=password\n\n  mongo-express:\n    image: mongo-express\n    ports:\n      - 8081:8081\n    environment:\n      - ME_CONFIG_MONGODB_SERVER=mongodb\n      - ME_CONFIG_MONGODB_ADMINUSERNAME=admin\n      - ME_CONFIG_MONGODB_ADMINPASSWORD=password\n    depends_on:\n      - mongodb", { x: 0.5, y: 1.15, w: 4.6, h: 3.9, fontSize: 9 });
  [["services", "One entry per container. The key is the service name = DNS name"], ["image", "Same as the docker run image argument"], ["ports", "Same as -p host:container (a list)"], ["environment", "Same as -e (a list of KEY=value)"], ["depends_on", "Start order only; doesn't wait until Mongo is ready"], ["network", "Not written: Compose makes one per project automatically"]].forEach(([k, v], i) => { box(s, { x: 5.35, y: 1.15 + i * 0.65, w: 1.5, h: 0.52, t: k, color: D.c, tc: C.background1, size: 10, bold: true, font: MONO }); text(s, v, { x: 6.95, y: 1.15 + i * 0.65, w: 2.55, h: 0.52, fontSize: 11, valign: "middle" }); });

  s = slide("CONTENT", "Compose commands", "docker compose (v2, built into Docker Desktop) replaced docker-compose (v1 Python). up creates network + containers; -d detached; down removes containers AND the network (not volumes unless -v). logs -f follows all services with colour prefixes. Project name defaults to the folder name, which prefixes container names: myapp-mongodb-1.");
  const cc = [["docker compose up -d", "Create the network, start every service in the background"], ["docker compose ps", "Status of this project's containers"], ["docker compose logs -f", "Follow logs of all services (or name one)"], ["docker compose exec mongodb mongosh", "Run a command inside a service's container"], ["docker compose down", "Stop and remove containers + network (keeps volumes)"], ["docker compose down -v", "…and remove named volumes too (data gone!)"], ["docker compose up -d --build", "Rebuild images from Dockerfiles first (section 9)"]];
  s.addTable(cc.map(r => [{ text: r[0], options: { fontFace: MONO, fontSize: 11, bold: true, color: H.dk1 } }, { text: r[1], options: { fontSize: 12, color: H.dk2 } }]), { x: 0.5, y: 1.2, w: 9, colW: [3.9, 5.1], rowH: 0.42, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, fill: { color: "FFFFFF" }, margin: 0.06, valign: "middle", objectName: "compose table" });
  keyline(s, "docker compose up  is the whole dev environment in one command. Commit the YAML; new teammates run it on day one.");

  // ================= 9/10. DOCKERFILE =================
  section = "Dockerfile"; pres.addSection({ title: section });
  s = slide("SECTION", "9 · Dockerfile: building our own image", "1:42:02. So far we only ran other people's images. Now the Node app becomes an image so it can be deployed like Mongo was.", "A blueprint for building images");

  s = slide("CONTENT", "The Dockerfile for the Node app", "Every image starts FROM a base. ENV sets variables (prefer compose/run-time for secrets). RUN executes at BUILD time inside the image (mkdir, npm install). COPY copies from the host (build context) into the image. WORKDIR sets the working dir. CMD is the ENTRYPOINT command executed at RUN time, only one CMD. Difference RUN vs CMD is the exam question.");
  code(s, "FROM node:20-alpine\n\nENV MONGO_DB_USERNAME=admin \\\n    MONGO_DB_PWD=password\n\nRUN mkdir -p /home/app\n\nCOPY ./app /home/app\n\nWORKDIR /home/app\n\nRUN npm install\n\nCMD [\"node\", \"server.js\"]", { x: 0.5, y: 1.15, w: 4.3, h: 3.9, fontSize: 12 });
  [["FROM", "Base image. Every Dockerfile starts here. node:20-alpine = Linux + Node preinstalled"], ["ENV", "Environment variables baked into the image. Fine for defaults; never for real secrets"], ["RUN", "Execute a shell command at BUILD time, inside the image. Result becomes a layer"], ["COPY", "Copy files from the host (build context) into the image. Host → image"], ["WORKDIR", "Set the working directory for the following instructions and for CMD"], ["CMD", "The command to run when a container STARTS. Only one; last wins"]].forEach(([k, v], i) => { box(s, { x: 5.1, y: 1.15 + i * 0.65, w: 1.2, h: 0.52, t: k, color: D.c, tc: C.background1, size: 11, bold: true, font: MONO }); text(s, v, { x: 6.4, y: 1.15 + i * 0.65, w: 3.1, h: 0.52, fontSize: 10, valign: "middle" }); });

  s = slide("CONTENT", "RUN vs CMD, and build vs run time", "The single most confused point. RUN happens while 'docker build' executes: install packages, create dirs; each RUN is a layer. CMD does NOT execute during build; it's stored as metadata and executed when 'docker run' starts a container. You can have many RUN, one effective CMD. ENTRYPOINT is like CMD but harder to override; CMD then supplies default args.");
  text(s, "docker build", { x: 0.5, y: 1.2, w: 4.4, h: 0.35, fontSize: 15, bold: true, color: D.c });
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.6, w: 4.4, h: 2.3, rectRadius: 0.1, fill: { color: D.tint }, line: { color: D.tint }, objectName: "build box" });
  bullets(s, ["FROM pulls the base", "COPY adds your files", "RUN npm install executes now, inside the image", "Result: a new image with N layers", "CMD is only recorded, not executed"], { x: 0.7, y: 1.75, w: 4.0, h: 2.1, fontSize: 12 });
  text(s, "docker run", { x: 5.1, y: 1.2, w: 4.4, h: 0.35, fontSize: 15, bold: true, color: D.c });
  s.addShape(pres.ShapeType.roundRect, { x: 5.1, y: 1.6, w: 4.4, h: 2.3, rectRadius: 0.1, fill: { color: D.tint }, line: { color: D.tint }, objectName: "run box" });
  bullets(s, ["Image layers mounted read-only + a writable layer", "WORKDIR applied, ENV set", "CMD executes: node server.js becomes PID 1", "Container lives while that process lives", "docker run image <other cmd> overrides CMD"], { x: 5.3, y: 1.75, w: 4.0, h: 2.1, fontSize: 12 });
  keyline(s, "RUN = build-time shell command (many).   CMD = the start command stored in the image (one).");

  s = slide("CONTENT", "Build, tag, run, iterate", "docker build -t my-app:1.0 . — the '.' is the build context: the folder sent to the daemon, which is what COPY can see. Tag name:version. Then run with -p and the right network so it can reach mongodb. Change code → rebuild → the old container must be removed (docker rm) and a new one run; images are immutable. Show the layered output and the cache.");
  code(s, "$ docker build -t my-app:1.0 .\n[+] Building 14.2s\n => [1/5] FROM node:20-alpine\n => [2/5] RUN mkdir -p /home/app\n => [3/5] COPY ./app /home/app\n => [4/5] WORKDIR /home/app\n => [5/5] RUN npm install\n => exporting to image  →  my-app:1.0\n\n$ docker images                      # my-app  1.0  …  148MB\n$ docker run -d --name my-app --network mongo-network -p 3000:3000 my-app:1.0\n$ docker logs my-app                 # app listening on port 3000", { x: 0.5, y: 1.2, w: 5.6, h: 3.1, fontSize: 8.5 });
  await card(s, { x: 6.3, y: 1.2, w: 3.2, h: 3.1, title: "When code changes", body: ["Images are immutable: edit → rebuild", "docker build -t my-app:1.1 .", "docker rm -f my-app, run the new tag", "Unchanged layers are cached: fast", "Put npm install before COPY of source to cache it (see notes)"], ic: "FaSyncAlt" });
  keyline(s, "Now the app is an image too. It can be shipped exactly like mongo:7 was.");

  // ================= 11. PRIVATE REGISTRY =================
  section = "Private registry"; pres.addSection({ title: section });
  s = slide("SECTION", "10 · Private registry: pushing the image to AWS ECR", "2:04:36. Docker Hub is public by default. Companies keep images in a private registry: AWS ECR, Google Artifact Registry, Azure ACR, Nexus, Harbor, or a private Docker Hub repo.", "Where your built images live so servers can pull them");

  s = slide("CONTENT", "Registry, repository, tag", "Registry = the service (ECR). Repository = one image name inside it (my-app); holds many tags (1.0, 1.1). On ECR one repository per application. The full image name encodes the address: <account>.dkr.ecr.<region>.amazonaws.com/my-app:1.0. Docker decides where to push purely from the name prefix.");
  box(s, { x: 0.5, y: 1.3, w: 9, h: 0.7, t: "123456789012.dkr.ecr.eu-central-1.amazonaws.com / my-app : 1.0", color: C.text1, tc: "E2E8F0", size: 15, bold: true, font: MONO });
  [["registry host", 0.5, 3.9, "the ECR service in one AWS account + region"], ["repository", 4.65, 1.5, "one per app"], ["tag", 6.4, 1.0, "the version"]].forEach(([t, x, w, d]) => { box(s, { x, y: 2.15, w, h: 0.45, t, color: D.c, tc: C.background1, size: 11, bold: true }); text(s, d, { x, y: 2.65, w, h: 0.5, fontSize: 10, color: C.text2, align: "center" }); });
  await card(s, { x: 0.5, y: 3.3, w: 4.4, h: 1.6, title: "Docker Hub", body: ["Default when no host is given: node:20 = docker.io/library/node:20", "Public images free; private repos on paid plans"], ic: "FaDocker" });
  await card(s, { x: 5.1, y: 3.3, w: 4.4, h: 1.6, title: "Private registries", body: ["AWS ECR, Google Artifact Registry, Azure ACR", "Self-hosted: Harbor, Nexus, GitLab registry"], ic: "FaLock" });

  s = slide("CONTENT", "Push to ECR in four steps", "1 Create repository in the ECR console (name my-app). 2 Authenticate: aws ecr get-login-password piped into docker login (needs AWS CLI configured with credentials). 3 Tag: docker tag my-app:1.0 <registry>/my-app:1.0 — tagging creates a second NAME for the same image ID, no copy. 4 docker push. Then on the next version: build 1.1, tag, push again; ECR shows both tags.");
  stepRow(s, ["1 · Create repo\nin ECR console:\nmy-app", "2 · Log in\naws ecr get-login-password\n| docker login", "3 · Tag\ndocker tag my-app:1.0\n<registry>/my-app:1.0", "4 · Push\ndocker push\n<registry>/my-app:1.0"], { y: 1.3, color: D.c, tint: D.tint, h: 1.2, size: 10 });
  code(s, "aws ecr get-login-password --region eu-central-1 \\\n  | docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-central-1.amazonaws.com\n\ndocker tag  my-app:1.0  123456789012.dkr.ecr.eu-central-1.amazonaws.com/my-app:1.0\ndocker push 123456789012.dkr.ecr.eu-central-1.amazonaws.com/my-app:1.0", { x: 0.5, y: 2.75, w: 9, h: 1.3, fontSize: 9.5 });
  bullets(s, ["docker tag doesn't copy: it adds another name to the same image ID", "docker push uploads only layers the registry doesn't have yet", "In real projects CI (Jenkins / GitHub Actions) runs these four steps on every merge"], { x: 0.5, y: 4.2, w: 9, h: 0.9, fontSize: 12 });

  // ================= 12. DEPLOY =================
  section = "Deploy"; pres.addSection({ title: section });
  s = slide("SECTION", "11 · Deploy the containerised app", "2:19:06. A server with Docker installed pulls the app image from ECR and the public mongo images from Docker Hub, then docker compose up. Mongo Express is optional in prod.", "The server pulls from the registry and runs docker compose up");

  s = slide("CONTENT", "Deployment with Compose: add the app as a third service", "Same compose file as section 8 plus a my-app service pointing at the ECR image. On the server: docker login to ECR, then docker compose up. The app's Mongo URL must now be mongodb://admin:password@mongodb:27017 (service name, not localhost). Show the three containers on one network; app reachable on server:3000.");
  code(s, "services:\n  my-app:\n    image: 1234.dkr.ecr.eu-central-1.amazonaws.com/my-app:1.0\n    ports:\n      - 3000:3000\n    environment:\n      - MONGO_DB_USERNAME=admin\n      - MONGO_DB_PWD=password\n    depends_on:\n      - mongodb\n\n  mongodb:\n    image: mongo:7\n    ports: [\"27017:27017\"]\n    environment:\n      - MONGO_INITDB_ROOT_USERNAME=admin\n      - MONGO_INITDB_ROOT_PASSWORD=password\n\n  mongo-express:\n    image: mongo-express\n    ports: [\"8081:8081\"]\n    environment:\n      - ME_CONFIG_MONGODB_SERVER=mongodb\n    depends_on: [mongodb]", { x: 0.5, y: 1.15, w: 4.6, h: 3.9, fontSize: 8 });
  s.addShape(pres.ShapeType.roundRect, { x: 5.35, y: 1.15, w: 4.15, h: 2.1, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "server box" });
  text(s, "Production server (Docker installed)", { x: 5.5, y: 1.2, w: 3.9, h: 0.3, fontSize: 11, bold: true, color: C.text2 });
  box(s, { x: 5.5, y: 1.55, w: 1.2, h: 0.7, t: "my-app\n:3000", color: D.c, tc: C.background1, size: 10, bold: true });
  box(s, { x: 6.85, y: 1.55, w: 1.2, h: 0.7, t: "mongodb\n:27017", color: D.c, tc: C.background1, size: 10, bold: true });
  box(s, { x: 8.2, y: 1.55, w: 1.2, h: 0.7, t: "mongo-\nexpress", color: D.tint, size: 10, bold: true });
  text(s, "one Compose network · services talk by name", { x: 5.5, y: 2.3, w: 3.9, h: 0.3, fontSize: 10, color: C.text2, align: "center", italic: true });
  box(s, { x: 5.5, y: 2.65, w: 3.9, h: 0.45, t: "docker login (ECR)  →  docker compose up -d", color: C.text1, tc: "E2E8F0", size: 10, bold: true, font: MONO });
  bullets(s, ["In server.js the Mongo host becomes  mongodb  (the service name)", "Secrets should come from env files or a secrets manager, not the YAML", "Same file works on a laptop and the server: that's the point"], { x: 5.35, y: 3.4, w: 4.15, h: 1.6, fontSize: 11 });

  // ================= 13/14. VOLUMES =================
  section = "Volumes"; pres.addSection({ title: section });
  s = slide("SECTION", "12 · Docker volumes: persisting data", "2:27:26. Problem: restart the mongodb container → all data gone, because the writable layer is deleted with the container. Volumes connect a host directory to a container directory so data survives.", "Data that outlives the container");

  s = slide("CONTENT", "Why data disappears, and the fix", "A container's filesystem = image layers (read-only) + one writable layer. Mongo writes to /data/db in that writable layer. Remove/recreate the container → layer gone → database empty. A volume mounts a directory from the HOST filesystem into the container at that path, so writes land on the host and survive. Also lets you back up and share data between containers.");
  text(s, "Without a volume", { x: 0.5, y: 1.15, w: 4.3, h: 0.3, fontSize: 14, bold: true, color: C.accent5 });
  box(s, { x: 0.6, y: 1.5, w: 4.1, h: 0.5, t: "container writable layer  ←  /data/db writes here", color: TINT.bad, size: 11, bold: true });
  box(s, { x: 0.6, y: 2.05, w: 4.1, h: 0.5, t: "mongo:7 image layers (read-only)", color: "CBD5E1", size: 11 });
  bullets(s, ["docker compose down / docker rm → writable layer deleted", "Next start: empty database", "Also lost on image upgrade (new container)"], { x: 0.6, y: 2.7, w: 4.1, h: 1.3, fontSize: 12 });
  text(s, "With a volume", { x: 5.3, y: 1.15, w: 4.3, h: 0.3, fontSize: 14, bold: true, color: D.c });
  box(s, { x: 5.4, y: 1.5, w: 4.1, h: 0.5, t: "/data/db  →  mounted from the host", color: D.c, tc: C.background1, size: 11, bold: true });
  box(s, { x: 5.4, y: 2.05, w: 4.1, h: 0.5, t: "mongo:7 image layers (read-only)", color: "CBD5E1", size: 11 });
  box(s, { x: 5.4, y: 2.7, w: 4.1, h: 0.5, t: "host: /var/lib/docker/volumes/mongo-data/_data", color: D.tint, size: 10, bold: true, font: MONO });
  bullets(s, ["Container removed → data still on the host", "New container mounts the same volume → data back", "Volumes are the unit of backup"], { x: 5.4, y: 3.3, w: 4.1, h: 1.0, fontSize: 12 });
  keyline(s, "Containers are disposable. Data must live somewhere that isn't.");

  s = slide("CONTENT", "Three kinds of volume", "1 Host (bind) volume: you choose the host path: -v /home/me/data:/data/db. 2 Anonymous volume: only the container path: -v /data/db; Docker picks a random host dir under /var/lib/docker/volumes. 3 Named volume: -v mongo-data:/data/db; Docker manages the location, you reference it by name. Named is the recommended one for production; bind mounts are for dev (live code).");
  const vol = [["Host / bind mount", "-v /home/me/mongo:/data/db", "You pick the host folder. Great for dev: edit code on the host, container sees it live", "FaFolderOpen"], ["Anonymous", "-v /data/db", "Docker picks a random folder. Hard to find and reuse. Avoid", "FaQuestion"], ["Named (recommended)", "-v mongo-data:/data/db", "Docker manages the location; you use the name. Listed by docker volume ls. Use in compose", "FaTag"]];
  for (let i = 0; i < 3; i++) {
    const y = 1.2 + i * 1.2;
    await card(s, { x: 0.5, y, w: 9, h: 1.1, title: vol[i][0], body: vol[i][2], ic: vol[i][3], bodySize: 12 });
    box(s, { x: 6.2, y: y + 0.2, w: 3.1, h: 0.45, t: vol[i][1], color: C.text1, tc: "E2E8F0", size: 10, bold: true, font: MONO });
  }
  keyline(s, "Where named volumes live: Mac  ~/Library/Containers/com.docker.docker/…   Linux  /var/lib/docker/volumes/<name>/_data");

  s = slide("CONTENT", "Volumes demo: persistence for the demo project", "2:33:03. Add a named volume to the mongodb service and declare it at the bottom under volumes:. docker compose up, save a profile, docker compose down, up again → data still there. Show docker volume ls and inspect to find the host path. Mongo's data dir is /data/db (check the image docs; MySQL is /var/lib/mysql, Postgres /var/lib/postgresql/data).");
  code(s, "services:\n  mongodb:\n    image: mongo:7\n    ports:\n      - 27017:27017\n    environment:\n      - MONGO_INITDB_ROOT_USERNAME=admin\n      - MONGO_INITDB_ROOT_PASSWORD=password\n    volumes:\n      - mongo-data:/data/db      # volume-name : path-in-container\n\n  mongo-express:\n    ...\n\nvolumes:\n  mongo-data:                    # declare it once here\n    driver: local", { x: 0.5, y: 1.15, w: 4.8, h: 3.9, fontSize: 9.5 });
  [["1 · docker compose up -d", D.c, C.background1], ["2 · Save a profile in the app", D.tint, C.text1], ["3 · docker compose down", D.tint, C.text1], ["4 · up -d again → data still there", D.c, C.background1]].forEach(([t, c, tc], i) => box(s, { x: 5.5 + (i % 2) * 2.05, y: 1.2 + Math.floor(i / 2) * 0.6, w: 1.95, h: 0.5, t, color: c, tc, size: 10, bold: true }));
  bullets(s, ["Container path per image: Mongo /data/db, MySQL /var/lib/mysql, Postgres /var/lib/postgresql/data", "docker volume ls  /  docker volume inspect mongo-data  → host path", "docker compose down -v  deletes the volume: only when you mean it"], { x: 5.5, y: 2.5, w: 4.0, h: 2.5, fontSize: 11 });

  // ================= WRAP =================
  section = "Wrap-up"; topic = Object.assign({}, NEUTRAL, { name: "Wrap-up" }); pres.addSection({ title: section });
  s = slide("CONTENT", "Wrap up: what you can do now", "2:45:13. Recap of the full workflow and the key mental models. Point to next topics.");
  const flow = [["Run any service\nwith docker run", "FaPlay"], ["Debug with\nlogs / exec", "FaSearch"], ["Compose a\nmulti-service app", "FaLayerGroup"], ["Build your own\nimage (Dockerfile)", "FaFileAlt"], ["Push to a\nprivate registry", "FaCloudUploadAlt"], ["Deploy + persist\nwith volumes", "FaDatabase"]];
  for (let i = 0; i < flow.length; i++) {
    const x = 0.5 + i * 1.52;
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.3, y: 1.25, w: 0.75, h: 0.75, fill: { color: D.c }, line: { color: D.c }, objectName: "flow circle " + i });
    s.addImage({ data: await icon(flow[i][1], "FFFFFF"), x: x + 0.475, y: 1.425, w: 0.4, h: 0.4, objectName: "flow icon " + i });
    text(s, flow[i][0], { x, y: 2.1, w: 1.35, h: 0.6, fontSize: 11, bold: true, align: "center" });
    if (i < flow.length - 1) arrow(s, x + 1.1, 1.62, x + 1.47, 1.62);
  }
  await recapInline(s);
  async function recapInline(s) {
    const items = [["Image = package, container = running instance", "FaCube"], ["Inside a container, localhost is the container; use service names", "FaNetworkWired"], ["RUN is build time, CMD is run time", "FaCogs"], ["Containers are disposable; data goes in volumes", "FaDatabase"]];
    for (let i = 0; i < items.length; i++) {
      const x = 0.5 + (i % 2) * 4.6, y = 3.0 + Math.floor(i / 2) * 0.95;
      s.addShape(pres.ShapeType.roundRect, { x, y, w: 4.4, h: 0.8, rectRadius: 0.1, fill: { color: D.tint }, line: { color: D.tint }, objectName: "recap " + i });
      s.addShape(pres.ShapeType.ellipse, { x: x + 0.15, y: y + 0.15, w: 0.5, h: 0.5, fill: { color: D.c }, line: { color: D.c }, objectName: "recap circle " + i });
      s.addImage({ data: await icon(items[i][1], "FFFFFF"), x: x + 0.25, y: y + 0.25, w: 0.3, h: 0.3, objectName: "recap icon " + i });
      text(s, items[i][0], { x: x + 0.8, y, w: 3.5, h: 0.8, fontSize: 12, bold: true, valign: "middle" });
    }
  }

  s = slide("CONTENT", "Where to go next", "Suggested follow-ups, in order of usefulness.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 3.6, title: "Better images", body: ["Multi-stage builds: tiny production images", ".dockerignore", "Non-root USER", "Layer ordering for cache", "docker scout / trivy for vulnerabilities"], ic: "FaLayerGroup", color: D.c, tint: D.tint });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 3.6, title: "Automate", body: ["CI builds + pushes the image (Jenkins, GitHub Actions)", "Tag with git SHA", "Compose profiles and env files", "Health checks"], ic: "FaCogs", color: TOPIC.ci.c, tint: TOPIC.ci.tint });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 3.6, title: "Orchestrate", body: ["Kubernetes: run containers across many servers", "Deployments, Services, rolling updates", "Managed: EKS, GKE, AKS", "Start with minikube"], ic: "SiKubernetes", color: TOPIC.k8s.c, tint: TOPIC.k8s.tint });

  s = slide("TITLE", "Thanks. Questions?", "End.", "Reference: 'Docker Tutorial for Beginners [FULL COURSE in 3 Hours]', TechWorld with Nana.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch(e => { console.error(e); process.exit(1); });
