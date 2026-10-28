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
pres.title = "Ship It: Docker, Kubernetes and CI/CD";
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
const FOOT = { text: "DevOps Workshop  ·  Docker · Kubernetes · CI/CD", options: { x: 0.5, y: 5.2, w: 6, h: 0.3, fontSize: 9, color: H.dk2, margin: 0 } };
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
  // ================= INTRO =================
  pres.addSection({ title: "Intro" });
  let s = slide("TITLE", "Ship It: Docker, Kubernetes & CI/CD", "Welcome. Put the repo URL / QR on screen and get everyone creating a Codespace immediately so it builds while we talk.", "A hands-on DevOps workshop · build it, containerise it, deploy it, automate it");
  s.addImage({ data: await icon("FaDocker", H.accent1), x: 6.2, y: 0.7, w: 0.8, h: 0.8, objectName: "docker icon" });
  s.addImage({ data: await icon("SiKubernetes", H.accent4), x: 7.3, y: 0.7, w: 0.8, h: 0.8, objectName: "k8s icon" });
  s.addImage({ data: await icon("FaJenkins", H.accent3), x: 8.4, y: 0.7, w: 0.8, h: 0.8, objectName: "jenkins icon" });
  box(s, { x: 0.6, y: 4.3, w: 8.8, h: 0.6, t: "Repo + labs:  github.com/PhalakshaCG/devops-session-10-26      →  Code ▸ Codespaces ▸ Create codespace", color: "1E293B", tc: "E2E8F0", size: 14, bold: true });

  // 2 agenda
  s = slide("CONTENT", "Today: the right half of the DevOps loop", "Plan-code-build-test-release-deploy-operate-monitor. Git covered plan/code. Today: build+test (Docker, CI), release+deploy (Kubernetes, CD). Point at the colour legend: every slide is colour-coded by topic.");
  const loop = ["Plan", "Code", "Build", "Test", "Release", "Deploy", "Operate", "Monitor"];
  loop.forEach((t, i) => {
    const done = i < 2, today = i >= 2 && i <= 5;
    box(s, { x: 0.5 + i * 1.13, y: 1.2, w: 1.03, h: 0.55, t, color: done ? "CBD5E1" : today ? C.text1 : C.background2, tc: today ? C.background1 : C.text1, bold: today, size: 13 });
    if (i < loop.length - 1) arrow(s, 1.53 + i * 1.13, 1.47, 1.63 + i * 1.13, 1.47);
  });
  text(s, "Git ✓ (done)", { x: 0.5, y: 1.8, w: 2.2, h: 0.3, fontSize: 11, color: C.text2 });
  text(s, "Today", { x: 2.76, y: 1.8, w: 4.6, h: 0.3, fontSize: 11, color: C.text1, bold: true });
  const agenda = [["0:40", "Docker: concepts", "13 min", TOPIC.docker], ["0:53", "Lab 1 · build & run a container", "30 min", TOPIC.lab], ["1:23", "Break (start minikube!)", "7 min", null], ["1:30", "Kubernetes: concepts", "13 min", TOPIC.k8s], ["1:43", "Lab 2 · deploy, scale, roll out on minikube", "30 min", TOPIC.lab], ["2:13", "CI/CD + Jenkins: concepts", "9 min", TOPIC.ci], ["2:22", "Lab 3 · a pipeline that runs on every push", "12 min", TOPIC.lab], ["2:34", "Big picture + Q&A", "6 min", null]];
  agenda.forEach((r, i) => {
    const y = 2.2 + i * 0.33;
    if (r[3]) s.addShape(pres.ShapeType.ellipse, { x: 0.55, y: y + 0.09, w: 0.15, h: 0.15, fill: { color: r[3].c }, line: { color: r[3].c }, objectName: "dot " + i });
    text(s, r[0], { x: 0.85, y, w: 0.7, h: 0.33, fontSize: 13, valign: "middle", color: C.text2 });
    text(s, r[1], { x: 1.6, y, w: 4.8, h: 0.33, fontSize: 13, valign: "middle", bold: !!r[3] && r[3] === TOPIC.lab });
    text(s, r[2], { x: 6.4, y, w: 0.8, h: 0.33, fontSize: 13, valign: "middle", color: C.text2 });
  });
  // legend
  s.addShape(pres.ShapeType.roundRect, { x: 7.4, y: 2.2, w: 2.1, h: 2.6, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "legend" });
  text(s, "Colour code", { x: 7.55, y: 2.28, w: 1.8, h: 0.3, fontSize: 12, bold: true });
  [["Docker", TOPIC.docker.c], ["Kubernetes", TOPIC.k8s.c], ["CI/CD", TOPIC.ci.c], ["Hands-on lab", TOPIC.lab.c], ["Good / done", C.accent6], ["Problem", C.accent5]].forEach(([t, c], i) => {
    s.addShape(pres.ShapeType.ellipse, { x: 7.6, y: 2.68 + i * 0.34, w: 0.2, h: 0.2, fill: { color: c }, line: { color: c }, objectName: "legend dot " + t });
    text(s, t, { x: 7.9, y: 2.63 + i * 0.34, w: 1.5, h: 0.3, fontSize: 12, valign: "middle" });
  });

  // 3 how it works
  s = slide("CONTENT", "How this session works", "Set expectations: short concept block, long lab, checkpoint. Students mirror your terminal. Thumbs up/down after each lab section. Second instructor floats.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 2.9, title: "1 · Watch", body: ["~10 minutes of concepts", "Every slide has one idea", "Colour tells you the topic", "Ask anytime"], ic: "FaEye", color: C.text2, tint: TINT.grey });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 2.9, title: "2 · Do", body: ["~30 minutes in your Codespace", "Open labs/0N-*.md", "Mirror the instructor's terminal", "Type it, don't paste it"], ic: "FaKeyboard", color: TOPIC.lab.c, tint: TOPIC.lab.tint });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 2.9, title: "3 · Check", body: ["Each lab has a 'Done when'", "bash labs/check.sh tells you what's missing", "Thumbs up = move on", "Stuck = raise your hand 🙋"], ic: "FaCheck", color: C.accent6, tint: TINT.good });
  keyline(s, "Nothing to install. Everything runs in GitHub Codespaces, in your browser.", C.text1);

  // ================= DOCKER =================
  section = "Docker"; topic = TOPIC.docker; pres.addSection({ title: section });
  s = slide("SECTION", "Part 1 · Docker", "Transition. Ask: who has had 'works on my machine' problems? Everyone in the Git lab had to npm install - that's the hook.", "Package the app with its environment. Run it the same way everywhere.");
  s.addImage({ data: await icon("FaDocker", H.accent1), x: 7.8, y: 1.6, w: 1.5, h: 1.5, objectName: "docker icon" });

  s = slide("CONTENT", "\"But it works on my machine\"", "The weather app from the Git lab: node version drift, missing .env, OS differences. Each card = a real failure students will have seen. Containers fix all three by shipping the environment with the code.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 2.9, title: "Different versions", body: ["Your laptop: Node 22", "Friend's laptop: Node 16", "Server: Node 18", "Same code, three behaviours"], ic: "FaCodeBranch", color: C.accent5, tint: TINT.bad });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 2.9, title: "Missing pieces", body: ["A package you forgot to list", "A .env file that's not in git", "A system library only you installed"], ic: "FaPuzzlePiece", color: C.accent5, tint: TINT.bad });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 2.9, title: "Different OS", body: ["Windows paths vs Linux paths", "Mac ARM chip vs Intel server", "\"Just install these 14 things first\""], ic: "FaDesktop", color: C.accent5, tint: TINT.bad });
  keyline(s, "Fix: ship the environment with the code (an image) and run it identically everywhere (a container).");

  s = slide("CONTENT", "Virtual machines vs containers", "Left: each VM has a full guest OS (GBs, minutes to boot). Right: containers share the host kernel, isolated by Linux namespaces + cgroups; MBs, start in ms. A container is just a process with a restricted view of the system.");
  text(s, "Virtual machines", { x: 0.5, y: 1.15, w: 4.2, h: 0.35, fontSize: 16, bold: true });
  [["App A", "Bins/Libs", "Guest OS"], ["App B", "Bins/Libs", "Guest OS"]].forEach((st, j) => st.forEach((t, i) => box(s, { x: 0.6 + j * 2.1, y: 1.6 + i * 0.5, w: 1.9, h: 0.45, t, color: i === 2 ? "CBD5E1" : C.background2, size: 12 })));
  box(s, { x: 0.6, y: 3.15, w: 4.0, h: 0.45, t: "Hypervisor", color: C.text2, tc: C.background1, size: 12, bold: true });
  box(s, { x: 0.6, y: 3.65, w: 4.0, h: 0.45, t: "Host OS  ·  Hardware", color: C.text1, tc: C.background1, size: 12 });
  bullets(s, ["Each VM boots a full OS: GBs, minutes", "Strong isolation, heavy"], { x: 0.6, y: 4.2, w: 4.0, h: 0.8, fontSize: 12 });
  text(s, "Containers", { x: 5.3, y: 1.15, w: 4.2, h: 0.35, fontSize: 16, bold: true, color: topic.c });
  ["App A", "App B", "App C"].forEach((t, j) => { box(s, { x: 5.4 + j * 1.37, y: 2.1, w: 1.27, h: 0.45, t, color: topic.tint, size: 12 }); box(s, { x: 5.4 + j * 1.37, y: 2.6, w: 1.27, h: 0.45, t: "Bins/Libs", color: topic.tint, size: 11 }); });
  box(s, { x: 5.4, y: 3.15, w: 4.0, h: 0.45, t: "Docker Engine", color: topic.c, tc: C.background1, size: 12, bold: true });
  box(s, { x: 5.4, y: 3.65, w: 4.0, h: 0.45, t: "Host OS (shared kernel)  ·  Hardware", color: C.text1, tc: C.background1, size: 12 });
  bullets(s, ["Share the host kernel: MBs, milliseconds", "Isolated by Linux namespaces + cgroups", "A container = a normal process in a box"], { x: 5.4, y: 4.2, w: 4.0, h: 0.9, fontSize: 12 });

  s = slide("CONTENT", "Four words, one flow", "Class/object analogy: Dockerfile is the recipe, image is the baked cake frozen (class), container is a running instance (object). Registry = GitHub for images. 'docker build' turns recipe into image; 'docker run' turns image into container; 'docker push/pull' moves images to/from a registry.");
  const vocab = [["Dockerfile", "A text recipe:\nstart from X, copy this, run that", "FaFileAlt"], ["Image", "The recipe baked. Read-only snapshot of a filesystem + a start command. Like a class", "FaLayerGroup"], ["Container", "A running instance of an image. Like an object. Start many from one image", "FaCube"], ["Registry", "Where images are stored and shared: Docker Hub, GHCR. 'git push' for images", "FaCloudUploadAlt"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * 2.33;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.3, w: 2.1, h: 2.5, rectRadius: 0.12, fill: { color: topic.tint }, line: { color: topic.tint }, objectName: vocab[i][0] + " card" });
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.75, y: 1.45, w: 0.6, h: 0.6, fill: { color: topic.c }, line: { color: topic.c }, objectName: vocab[i][0] + " circle" });
    s.addImage({ data: await icon(vocab[i][2], "FFFFFF"), x: x + 0.9, y: 1.6, w: 0.3, h: 0.3, objectName: vocab[i][0] + " icon" });
    text(s, vocab[i][0], { x, y: 2.15, w: 2.1, h: 0.4, fontSize: 17, bold: true, align: "center", valign: "middle" });
    text(s, vocab[i][1], { x: x + 0.15, y: 2.6, w: 1.8, h: 1.15, fontSize: 11, align: "center" });
  }
  [["docker build", 2.6], ["docker run", 4.93], ["docker push / pull", 7.26]].forEach(([t, x]) => { arrow(s, x, 4.05, x + 0.23, 4.05, topic.c); text(s, t, { x: x - 0.7, y: 4.1, w: 1.6, h: 0.3, fontSize: 10, fontFace: MONO, align: "center", color: topic.c, bold: true }); });
  keyline(s, "build: Dockerfile → Image.    run: Image → Container.    push / pull: Image ⇄ Registry.");

  s = slide("CONTENT", "The Dockerfile we'll use (6 instructions)", "Walk line by line. Emphasise: package.json copied BEFORE source so npm install layer is cached. CMD uses exec form (JSON array) so signals reach node. EXPOSE is documentation only; -p actually publishes.");
  code(s, "FROM node:20-alpine\n\nWORKDIR /app\n\nCOPY package.json ./\nRUN npm install --omit=dev\n\nCOPY . .\n\nEXPOSE 3000\n\nCMD [\"node\", \"index.js\"]", { x: 0.5, y: 1.2, w: 4.3, h: 3.8, fontSize: 14 });
  const dfl = [["FROM", "Base image: a tiny Linux with Node 20 already installed"], ["WORKDIR", "cd into /app inside the image (creates it)"], ["COPY + RUN", "Copy only package.json, install deps. Cached unless package.json changes"], ["COPY . .", "Now the source code. It changes often, so it comes last"], ["EXPOSE", "Documentation only: 'this app listens on 3000'"], ["CMD", "The process to start. One container = one process"]];
  dfl.forEach(([k, v], i) => { box(s, { x: 5.1, y: 1.2 + i * 0.63, w: 1.3, h: 0.5, t: k, color: topic.c, tc: C.background1, size: 11, bold: true, font: MONO }); text(s, v, { x: 6.5, y: 1.2 + i * 0.63, w: 3.0, h: 0.5, fontSize: 12, valign: "middle" }); });

  s = slide("CONTENT", "Images are layers, and layers are cached", "Each instruction adds a read-only layer. Docker caches layers; a change invalidates that layer and everything after. That's why package.json goes before the source. A container adds a thin writable layer on top: that's why deleting a container loses its data (unless you use volumes).");
  const layers = [["CMD [\"node\",\"index.js\"]", "tiny"], ["COPY . .", "your code: changes every commit"], ["RUN npm install", "node_modules: slow, so we want it cached"], ["COPY package.json", "small"], ["WORKDIR /app", "tiny"], ["FROM node:20-alpine", "~50 MB, shared by every Node image"]];
  box(s, { x: 0.6, y: 1.15, w: 3.6, h: 0.42, t: "container writable layer (lost on docker rm)", color: TINT.grey, size: 10, dash: "dash" });
  layers.forEach(([t, d], i) => { box(s, { x: 0.6, y: 1.67 + i * 0.53, w: 3.6, h: 0.46, t, color: i < 2 ? topic.c : "7DD3FC", tc: i < 2 ? C.background1 : C.text1, size: 11, bold: true, font: MONO }); text(s, d, { x: 4.35, y: 1.67 + i * 0.53, w: 2.0, h: 0.46, fontSize: 11, color: C.text2, valign: "middle" }); });
  text(s, "↑ rebuilt when index.js changes", { x: 4.35, y: 1.15, w: 2.1, h: 0.42, fontSize: 10, color: topic.c, bold: true, valign: "middle" });
  await card(s, { x: 6.6, y: 1.15, w: 2.9, h: 3.7, title: "Why it matters", body: ["Change index.js → only the top 2 layers rebuild. Seconds, not minutes", "Change package.json → npm install re-runs", "Rule: things that change rarely go first", "Containers are disposable; images are not"], ic: "FaBolt" });

  s = slide("CONTENT", "What actually happens on 'docker run'", "Demystify: it's not magic. 1 look up image locally, 2 pull from registry if missing, 3 create a container = image layers + a new writable layer + its own network namespace, 4 wire the port mapping, 5 start the CMD as PID 1. When that process exits the container stops. Port mapping: -p HOST:CONTAINER, left side is what you type in the browser.");
  code(s, "docker run -d -p 3000:3000 --name web hello-devops:v1", { x: 0.5, y: 1.15, w: 9, h: 0.5, fontSize: 13 });
  stepRow(s, ["1 · Find the image\nlocally, else pull\nfrom registry", "2 · Create a container\nimage layers +\nnew writable layer", "3 · Give it its own\nnetwork, filesystem\nand process space", "4 · Map host port\n3000 → container\nport 3000", "5 · Start CMD\nnode index.js\nas process #1"], { y: 1.85, color: topic.c, tint: topic.tint, h: 1.15, size: 11 });
  // port mapping mini diagram
  box(s, { x: 0.5, y: 3.3, w: 1.9, h: 0.8, t: "Your browser\nlocalhost:3000", color: TINT.grey, size: 11, bold: true });
  arrow(s, 2.4, 3.7, 3.1, 3.7, topic.c);
  box(s, { x: 3.1, y: 3.3, w: 2.0, h: 0.8, t: "Host port 3000\n(the -p left side)", color: topic.tint, size: 11, bold: true });
  arrow(s, 5.1, 3.7, 5.8, 3.7, topic.c);
  box(s, { x: 5.8, y: 3.3, w: 3.7, h: 0.8, t: "Container port 3000  (the -p right side)\nnode is listening here", color: topic.c, tc: C.background1, size: 11, bold: true });
  keyline(s, "A container lives exactly as long as its main process. Process exits → container stops.");

  s = slide("CONTENT", "Container lifecycle", "Walk the states and the commands that move between them. Key: stop keeps the container (and its writable layer), rm deletes it. The image is untouched throughout. Students do exactly this in lab step 7.");
  const states = [["Image", "7DD3FC"], ["Created", topic.tint], ["Running", topic.c], ["Stopped", topic.tint], ["Removed", TINT.grey]];
  states.forEach(([t, c], i) => box(s, { x: 0.5 + i * 1.85, y: 1.5, w: 1.6, h: 0.8, t, color: c, tc: i === 2 ? C.background1 : C.text1, size: 14, bold: true }));
  [["docker run", 0], ["(auto)", 1], ["docker stop", 2], ["docker rm", 3]].forEach(([t, i]) => { arrow(s, 2.1 + i * 1.85, 1.9, 2.35 + i * 1.85, 1.9, topic.c); text(s, t, { x: 1.85 + i * 1.85, y: 2.35, w: 0.75, h: 0.3, fontSize: 9, fontFace: MONO, align: "center", color: topic.c, bold: true }); });
  s.addShape(pres.ShapeType.line, { x: 6.4, y: 1.25, w: 0, h: 0.25, line: { color: H.accent1, width: 1.5 }, objectName: "start tick" });
  arrow(s, 6.4, 1.25, 4.4, 1.25, topic.c); text(s, "docker start", { x: 4.6, y: 1.0, w: 1.6, h: 0.25, fontSize: 9, fontFace: MONO, align: "center", color: topic.c, bold: true });
  await card(s, { x: 0.5, y: 2.85, w: 4.4, h: 1.95, title: "While it's Running", body: ["docker ps: list it", "docker logs web: its stdout", "docker exec -it web sh: a shell inside", "docker stats: CPU / memory"], ic: "FaPlay" });
  await card(s, { x: 5.1, y: 2.85, w: 4.4, h: 1.95, title: "Stopped vs removed", body: ["stop: process killed, files kept, can start again", "rm: container gone, writable layer gone", "The image is never affected", "docker ps -a shows stopped ones too"], ic: "FaTrashAlt" });

  s = slide("CONTENT", "Docker commands you'll use in the lab", "Read the table quickly; they'll type each one in 5 minutes. Highlight -p host:container and that 'docker exec' drops you inside a running container.");
  const cmds = [["docker build -t hello-devops:v1 .", "Dockerfile → image.  -t name:tag,  '.' = folder to send"], ["docker images", "Images on this machine"], ["docker run -d -p 3000:3000 --name web hello-devops:v1", "Image → container.  -d background,  -p host:container"], ["docker ps   /   docker ps -a", "Running containers / including stopped"], ["docker logs web", "What the app printed"], ["docker exec -it web sh", "Open a shell inside the container"], ["docker run -e APP_VERSION=v2 ...", "Configure with env vars, don't rebuild"], ["docker stop web && docker rm web", "Containers are disposable"]];
  s.addTable(cmds.map(r => [{ text: r[0], options: { fontFace: MONO, fontSize: 11, color: H.dk1, bold: true } }, { text: r[1], options: { fontSize: 12, color: H.dk2 } }]), { x: 0.5, y: 1.2, w: 9, colW: [4.6, 4.4], rowH: 0.42, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, fill: { color: "FFFFFF" }, margin: 0.06, valign: "middle", objectName: "commands table" });

  await quiz("Quick check · Docker", ["If I run the same image twice, do the two containers share files they write at runtime?", "I changed index.js and rebuilt. Does 'npm install' run again? Why not?", "I ran with -p 8080:3000. Which port do I type in the browser?"], "1 No: each container gets its own writable layer; the image is shared read-only. 2 No: the COPY . . layer changed but RUN npm install is above it and cached. 3 8080, the host side of -p.");

  await recap("Docker · 3 things to remember", [["Image = frozen filesystem + start command. Container = that image, running.", "Build once, run many. Same image on your laptop, in CI and in production.", "FaLayerGroup"], ["A container is just a process in a box, not a small VM.", "It shares the host kernel, starts in milliseconds and dies when its main process exits.", "FaCube"], ["Order your Dockerfile so rarely-changing things come first.", "Layers are cached top-down; dependencies before source code keeps rebuilds fast.", "FaBolt"]], "Say these three out loud. Then straight into Lab 1.");

  await labSlide("Lab 1 · Build and run a container", "30 minutes. Lead from your own Codespace on the projector. Checkpoints: after build (thumbs up), after browser opens, after exec. Floater handles 'cannot connect to daemon' (wait 30s).", "labs/01-docker.md",
    ["Run the app with npm (the old way)", "Read the Dockerfile", "docker build → docker images", "docker run -d -p 3000:3000 → open in browser", "docker logs, docker exec: look inside", "Same image, APP_VERSION=v2 on port 3001", "Stop, rm, clean up"],
    "You opened the app in a browser from a container, and ran a second copy with a different version.",
    ["bash labs/check.sh", "Daemon error → wait 30 s, retry", "No port popup → PORTS tab 🙋"], "30 min");

  // ================= KUBERNETES =================
  section = "Kubernetes"; topic = TOPIC.k8s; pres.addSection({ title: section });
  s = slide("SECTION", "Part 2 · Kubernetes", "Handover to instructor B. Hook: 'you ran 2 containers by hand. Now imagine 200, across 30 servers, and one just died at 3am.'", "Running containers at scale, without babysitting them");
  s.addImage({ data: await icon("SiKubernetes", H.accent4), x: 7.8, y: 1.6, w: 1.5, h: 1.5, objectName: "k8s icon" });

  s = slide("CONTENT", "Docker runs one container. Who runs 200?", "Each card is a question docker alone doesn't answer. Kubernetes is 'the thing that answers them'. Keep it to 2 minutes.");
  const why = [["It crashed at 3 am", "Who notices? Who restarts it?", "FaHeartbeat"], ["Traffic spiked", "Who starts 10 more copies, and spreads them over 5 servers?", "FaChartLine"], ["New version", "How do you update without downtime? Roll back if it's bad?", "FaSyncAlt"], ["Finding each other", "Container IPs change. How does the frontend find the backend?", "FaNetworkWired"]];
  for (let i = 0; i < 4; i++) await card(s, { x: 0.5 + (i % 2) * 4.6, y: 1.2 + Math.floor(i / 2) * 1.6, w: 4.4, h: 1.45, title: why[i][0], body: why[i][1], ic: why[i][2], color: C.accent5, tint: TINT.bad });
  keyline(s, "Kubernetes (K8s) is an orchestrator: you describe what you want, it keeps reality matching.");

  s = slide("CONTENT", "Cluster architecture", "Control plane = the brain (API server is the only thing you talk to; etcd stores state; scheduler picks a node; controllers reconcile). Nodes = the muscle (kubelet runs pods via the container runtime, kube-proxy does networking). minikube puts all of this on ONE machine.");
  text(s, "Control plane (the brain)", { x: 0.5, y: 1.15, w: 4, h: 0.3, fontSize: 14, bold: true, color: topic.c });
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.5, w: 3.9, h: 3.3, rectRadius: 0.1, fill: { color: topic.tint }, line: { color: topic.tint }, objectName: "cp box" });
  [["kube-apiserver", "front door: everything goes through it (kubectl talks here)"], ["etcd", "key-value database: the cluster's memory"], ["scheduler", "picks which node a new Pod runs on"], ["controller manager", "reconciliation loops: desired vs actual"]].forEach(([t, d], i) => { box(s, { x: 0.65, y: 1.65 + i * 0.78, w: 1.5, h: 0.6, t, color: topic.c, tc: C.background1, size: 11, bold: true }); text(s, d, { x: 2.25, y: 1.65 + i * 0.78, w: 2.05, h: 0.6, fontSize: 11, valign: "middle" }); });
  text(s, "Worker nodes (the muscle)", { x: 5.0, y: 1.15, w: 4.5, h: 0.3, fontSize: 14, bold: true, color: topic.c });
  for (let n = 0; n < 2; n++) {
    const x = 5.0 + n * 2.3;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.5, w: 2.2, h: 3.3, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "node box " + n });
    text(s, "node " + (n + 1), { x: x + 0.1, y: 1.55, w: 2, h: 0.3, fontSize: 11, bold: true, color: C.text2 });
    ["kubelet", "kube-proxy", "container runtime"].forEach((t, i) => box(s, { x: x + 0.15, y: 1.9 + i * 0.5, w: 1.9, h: 0.45, t, color: "C4B5FD", size: 11, bold: true }));
    box(s, { x: x + 0.15, y: 3.45, w: 0.9, h: 0.6, t: "Pod", color: topic.c, tc: C.background1, size: 11, bold: true });
    box(s, { x: x + 1.15, y: 3.45, w: 0.9, h: 0.6, t: "Pod", color: topic.c, tc: C.background1, size: 11, bold: true });
    text(s, "…", { x: x + 0.15, y: 4.1, w: 1.9, h: 0.3, fontSize: 12, align: "center" });
  }
  arrow(s, 4.4, 3.1, 5.0, 3.1, topic.c);
  text(s, "minikube = all of this on one machine, for learning", { x: 0.5, y: 4.9, w: 9, h: 0.3, fontSize: 12, color: C.text2, italic: true });

  s = slide("CONTENT", "Three objects cover 80% of what you'll do", "Pod: smallest unit, usually 1 container, gets an IP, is mortal. Deployment: 'keep N pods of this template running', handles rollouts. Service: stable name + IP + load balancing in front of pods selected by label. Labels are the glue.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 3.0, title: "Pod", body: ["Smallest unit: 1 (or a few) containers", "Gets its own IP", "Mortal: dies, gets replaced, new IP", "You rarely create Pods directly"], ic: "FaCube" });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 3.0, title: "Deployment", body: ["\"Keep 2 Pods of this template running\"", "Scales up / down", "Rolling updates + rollbacks", "Replaces dead Pods"], ic: "FaLayerGroup" });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 3.0, title: "Service", body: ["Stable name + IP for a set of Pods", "Load-balances across them", "Finds Pods by label", "Types: ClusterIP, NodePort, LoadBalancer"], ic: "FaNetworkWired" });
  keyline(s, "The glue is labels: Deployment manages, and Service routes to, Pods labelled  app: hello-devops");

  s = slide("CONTENT", "The one idea behind everything: desired state", "This is THE mental model. You never tell K8s 'start a container'. You declare 'replicas: 2'. Controllers loop forever: observe → compare → act. Delete a pod in lab 2 and watch this loop fix it.");
  box(s, { x: 0.5, y: 1.4, w: 2.5, h: 1.2, t: "You declare\n(YAML)\nreplicas: 2", color: C.text1, tc: C.background1, size: 14, bold: true });
  arrow(s, 3.0, 2.0, 3.5, 2.0, topic.c);
  box(s, { x: 3.5, y: 1.4, w: 2.5, h: 1.2, t: "Controller compares\ndesired vs actual", color: topic.c, tc: C.background1, size: 14, bold: true });
  arrow(s, 6.0, 2.0, 6.5, 2.0, topic.c);
  box(s, { x: 6.5, y: 1.4, w: 3.0, h: 1.2, t: "Acts\nstart / stop / move Pods", color: topic.tint, size: 14, bold: true });
  arrow(s, 8.0, 2.6, 8.0, 2.95, topic.c); s.addShape(pres.ShapeType.line, { x: 4.75, y: 2.95, w: 3.25, h: 0, line: { color: H.accent4, width: 1.5, dashType: "dash" }, objectName: "loop line" }); arrow(s, 4.75, 2.95, 4.75, 2.6, topic.c);
  text(s, "…forever, every few seconds (the reconciliation loop)", { x: 4.75, y: 3.0, w: 3.5, h: 0.3, fontSize: 11, color: C.text2, align: "center", italic: true });
  bullets(s, ["Imperative: \"start container X on server 3\" (you do the work, you handle failure)", "Declarative: \"I want 2 copies of X\" (K8s does the work, forever)", "A Pod dies → actual = 1, desired = 2 → a new Pod appears. Nobody got paged.", "Scaling = change one number. Updating = change one image tag."], { x: 0.5, y: 3.45, w: 9, h: 1.6, fontSize: 14 });

  s = slide("CONTENT", "Every YAML file has the same 4 parts", "Drill this: apiVersion, kind, metadata, spec. Spec is what you want; status is what K8s observed (never written by you). Once students see this shape they can read any K8s manifest.");
  code(s, "apiVersion: apps/v1      # which API group / version\nkind: Deployment         # what type of object\nmetadata:                # name, labels, namespace\n  name: hello-devops\nspec:                    # DESIRED state: what you want\n  replicas: 2\n  ...\n\n# status:                # ACTUAL state: written by K8s,\n#   readyReplicas: 2     # never by you", { x: 0.5, y: 1.2, w: 5.6, h: 3.0, fontSize: 11 });
  [["apiVersion", "Which API to use. apps/v1 for Deployments, v1 for Pods and Services"], ["kind", "The object type: Pod, Deployment, Service, …"], ["metadata", "Identity: name, labels (key: value tags used for selecting)"], ["spec", "Desired state. The part you write and care about"]].forEach(([k, v], i) => { box(s, { x: 6.3, y: 1.2 + i * 0.75, w: 1.2, h: 0.6, t: k, color: topic.c, tc: C.background1, size: 11, bold: true, font: MONO }); text(s, v, { x: 7.6, y: 1.2 + i * 0.75, w: 1.9, h: 0.6, fontSize: 11, valign: "middle" }); });
  keyline(s, "kubectl apply -f file.yaml  sends the spec to the API server. Controllers do the rest.");

  s = slide("CONTENT", "k8s/deployment.yaml", "Walk the YAML: selector must match template labels. imagePullPolicy IfNotPresent so minikube uses the locally loaded image instead of trying Docker Hub. readinessProbe: don't send traffic until /health says ok.");
  code(s, "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: hello-devops\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: hello-devops\n  template:\n    metadata:\n      labels:\n        app: hello-devops\n    spec:\n      containers:\n        - name: hello-devops\n          image: hello-devops:v1\n          imagePullPolicy: IfNotPresent\n          ports:\n            - containerPort: 3000\n          readinessProbe:\n            httpGet: { path: /health, port: 3000 }", { x: 0.5, y: 1.15, w: 4.6, h: 3.9, fontSize: 10 });
  [["replicas", "Desired number of Pods"], ["selector", "Which Pods this Deployment owns (by label)"], ["template", "The Pod recipe: labels + containers"], ["image", "From Lab 1. IfNotPresent = use the one we loaded into minikube"], ["containerPort", "Where the app listens inside the Pod"], ["readinessProbe", "No traffic until /health answers OK"]].forEach(([k, v], i) => { box(s, { x: 5.35, y: 1.15 + i * 0.65, w: 1.5, h: 0.52, t: k, color: topic.c, tc: C.background1, size: 10, bold: true, font: MONO }); text(s, v, { x: 6.95, y: 1.15 + i * 0.65, w: 2.55, h: 0.52, fontSize: 11, valign: "middle" }); });

  s = slide("CONTENT", "k8s/service.yaml and how traffic flows", "Service selects pods by label, gives one stable virtual IP + DNS name (hello-devops). port = service port, targetPort = container port. NodePort also opens a port on the node. In Codespaces: port-forward for the browser (sticks to ONE pod), and a curl loop against minikube service --url to see load-balancing across pods.");
  code(s, "apiVersion: v1\nkind: Service\nmetadata:\n  name: hello-devops\nspec:\n  type: NodePort\n  selector:\n    app: hello-devops\n  ports:\n    - port: 80\n      targetPort: 3000", { x: 0.5, y: 1.15, w: 3.6, h: 3.0, fontSize: 12 });
  box(s, { x: 4.5, y: 1.3, w: 1.6, h: 0.7, t: "Browser\n(port-forward 8080)", color: TINT.grey, size: 11, bold: true });
  arrow(s, 6.1, 1.65, 6.6, 1.65, topic.c);
  box(s, { x: 6.6, y: 1.3, w: 2.9, h: 0.7, t: "Service hello-devops\n:80  (stable IP + DNS name)", color: topic.c, tc: C.background1, size: 11, bold: true });
  arrow(s, 7.2, 2.0, 6.4, 2.7, topic.c); arrow(s, 8.05, 2.0, 8.05, 2.7, topic.c); arrow(s, 8.9, 2.0, 9.5, 2.7, topic.c);
  ["Pod a1b2", "Pod c3d4", "Pod e5f6"].forEach((t, i) => box(s, { x: 5.6 + i * 1.5, y: 2.7, w: 1.4, h: 0.6, t: t + "\n:3000", color: topic.tint, size: 10, bold: true }));
  text(s, "all labelled  app: hello-devops", { x: 5.6, y: 3.35, w: 4.4, h: 0.3, fontSize: 10, color: C.text2, align: "center", italic: true });
  bullets(s, ["port: what the Service listens on", "targetPort: what the container listens on", "curl the Service in a loop → 'host' changes = load-balancing", "Pods come and go; the Service name never changes"], { x: 4.5, y: 3.75, w: 5.0, h: 1.3, fontSize: 12 });

  s = slide("CONTENT", "Rolling update, step by step", "kubectl set image (or edit YAML + apply) changes the desired image. Deployment creates a new ReplicaSet for v2 and shifts pods one at a time: start a v2, wait until Ready (readiness probe!), kill a v1. Old ReplicaSet is kept at 0 replicas, which is what rollout undo switches back to.");
  const stages = [["Before", ["v1", "v1"]], ["Step 1", ["v1", "v1", "v2"]], ["Step 2", ["v1", "v2", "v2"]], ["After", ["v2", "v2"]]];
  stages.forEach(([t, pods], i) => {
    const x = 0.5 + i * 2.33;
    text(s, t, { x, y: 1.2, w: 2.1, h: 0.3, fontSize: 13, bold: true, align: "center" });
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.55, w: 2.1, h: 1.5, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "stage " + i });
    pods.forEach((p, j) => box(s, { x: x + 0.15 + j * 0.62, y: 2.0, w: 0.55, h: 0.6, t: p, color: p === "v2" ? topic.c : "C4B5FD", tc: p === "v2" ? C.background1 : C.text1, size: 11, bold: true }));
    if (i < 3) arrow(s, x + 2.1, 2.3, x + 2.33, 2.3, topic.c);
  });
  bullets(s, ["Start one new Pod → wait until its readiness probe passes → only then remove one old Pod", "The Service keeps routing to whichever Pods are Ready: users never see an error", "The old version is kept (at 0 copies) so  kubectl rollout undo  is instant", "Bad image tag? New Pods never become Ready, old ones stay. The rollout just stalls, safely"], { x: 0.5, y: 3.3, w: 9, h: 1.7, fontSize: 13 });

  s = slide("CONTENT", "Pod statuses you'll see", "Students WILL hit these in lab 2 (challenge uses a bad tag). Teach the loop: get pods → describe pod → read Events → logs. Pending = no node can fit it or still scheduling. ContainerCreating = pulling image. ErrImagePull/ImagePullBackOff = wrong name/tag or not loaded. CrashLoopBackOff = app starts then dies, read logs.");
  const st = [["Pending", "Scheduler hasn't placed it yet, or no node has room", "wait / check resources", "7DD3FC"], ["ContainerCreating", "Pulling the image, setting up the container", "wait a few seconds", "7DD3FC"], ["Running  1/1", "Healthy. READY column = containers ready / total", "nothing: this is good", H.accent6], ["ErrImagePull / ImagePullBackOff", "Image name or tag wrong, or not loaded into minikube", "fix tag / minikube image load", H.accent5], ["CrashLoopBackOff", "The app starts, crashes, K8s restarts it, repeat", "kubectl logs <pod>", H.accent5]];
  s.addTable([[{ text: "STATUS", options: { bold: true, color: H.lt1, fill: { color: H.dk1 } } }, { text: "Meaning", options: { bold: true, color: H.lt1, fill: { color: H.dk1 } } }, { text: "What you do", options: { bold: true, color: H.lt1, fill: { color: H.dk1 } } }]].concat(st.map(r => [{ text: r[0], options: { fontFace: MONO, bold: true, color: r[3] === "7DD3FC" ? H.accent4 : r[3], fontSize: 11 } }, { text: r[1], options: { fontSize: 12 } }, { text: r[2], options: { fontSize: 12 } }])), { x: 0.5, y: 1.2, w: 9, colW: [2.9, 3.6, 2.5], rowH: 0.45, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, fill: { color: "FFFFFF" }, margin: 0.06, valign: "middle", fontSize: 12, color: H.dk1, objectName: "status table" });
  keyline(s, "Debug loop:  kubectl get pods  →  kubectl describe pod <name>  (read Events)  →  kubectl logs <name>");

  s = slide("CONTENT", "kubectl commands you'll use in the lab", "They'll type all of these. Highlight the trio for debugging: get, describe, logs. 'describe' Events section explains 90% of failures.");
  const kc = [["kubectl apply -f k8s/", "Create / update everything in the folder (declarative)"], ["kubectl get pods -o wide", "List Pods, which node, which IP"], ["kubectl describe pod <name>", "Details + Events: why is it not Running?"], ["kubectl logs <pod>", "Container stdout"], ["kubectl port-forward svc/hello-devops 8080:80", "Tunnel the Service to your browser"], ["kubectl scale deploy hello-devops --replicas=4", "Change desired state"], ["kubectl set image deploy/hello-devops hello-devops=hello-devops:v2", "Rolling update"], ["kubectl rollout undo deploy/hello-devops", "The oops button"], ["kubectl delete -f k8s/", "Clean up"]];
  s.addTable(kc.map(r => [{ text: r[0], options: { fontFace: MONO, fontSize: 10, color: H.dk1, bold: true } }, { text: r[1], options: { fontSize: 11, color: H.dk2 } }]), { x: 0.5, y: 1.15, w: 9, colW: [5.2, 3.8], rowH: 0.4, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, fill: { color: "FFFFFF" }, margin: 0.05, valign: "middle", objectName: "kubectl table" });

  s = slide("CONTENT", "Our setup: minikube inside GitHub Codespaces", "Explain the nesting so port-forward and 'minikube image load' make sense: minikube's node is itself a docker container, with its own image store. Your Lab 1 image is in the outer docker; you must load it in. The browser reaches the Codespace via VS Code port forwarding.");
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.2, w: 9, h: 3.1, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "codespace box" });
  text(s, "GitHub Codespace (a Linux VM in the cloud, 2 CPU / 8 GB)", { x: 0.65, y: 1.27, w: 8.7, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  s.addShape(pres.ShapeType.roundRect, { x: 0.7, y: 1.65, w: 8.6, h: 2.5, rectRadius: 0.1, fill: { color: TINT.docker }, line: { color: TINT.docker }, objectName: "docker box" });
  text(s, "Docker Engine (docker-in-docker)", { x: 0.85, y: 1.72, w: 8, h: 0.3, fontSize: 12, bold: true, color: TOPIC.docker.c });
  box(s, { x: 0.9, y: 2.1, w: 2.3, h: 0.9, t: "your image + containers\nfrom Lab 1\n(hello-devops:v1)", color: TOPIC.docker.c, tc: C.background1, size: 11, bold: true });
  s.addShape(pres.ShapeType.roundRect, { x: 3.6, y: 2.1, w: 5.5, h: 1.9, rectRadius: 0.1, fill: { color: TINT.k8s }, line: { color: TINT.k8s }, objectName: "minikube box" });
  text(s, "minikube node (one container, with its own image store)", { x: 3.75, y: 2.15, w: 5.3, h: 0.3, fontSize: 12, bold: true, color: topic.c });
  box(s, { x: 3.8, y: 2.55, w: 2.4, h: 0.6, t: "control plane", color: topic.c, tc: C.background1, size: 11, bold: true });
  box(s, { x: 6.4, y: 2.55, w: 1.2, h: 0.6, t: "Pod", color: topic.c, tc: C.background1, size: 11, bold: true });
  box(s, { x: 7.75, y: 2.55, w: 1.2, h: 0.6, t: "Pod", color: topic.c, tc: C.background1, size: 11, bold: true });
  box(s, { x: 3.8, y: 3.25, w: 5.15, h: 0.6, t: "minikube image load hello-devops:v1  copies the image in here", color: "FFFFFF", size: 11, bold: true, font: MONO });
  arrow(s, 3.2, 2.55, 3.6, 2.55, topic.c);
  keyline(s, "Browser  ⇄  VS Code port forwarding  ⇄  kubectl port-forward svc/hello-devops 8080:80  ⇄  Pods");

  await quiz("Quick check · Kubernetes", ["I run  kubectl delete pod <name>  on a Pod owned by a Deployment. What happens 2 seconds later?", "Pods get new IPs when they restart. So how does a browser (or another service) reliably reach them?", "A new Pod shows  ImagePullBackOff.  Name two likely causes."], "1 A new Pod appears: desired 2, actual 1, controller fixes it. 2 Through a Service: stable name + IP, routes by label. 3 Wrong image name/tag, or image not loaded into minikube (no registry).");

  await recap("Kubernetes · 3 things to remember", [["You declare desired state; controllers make it real, forever.", "replicas: 2 means K8s will keep two running even if you delete one. Scaling and updating are one-line changes.", "FaSyncAlt"], ["Pod runs containers. Deployment keeps N Pods. Service gives them one address.", "Labels connect the three. Everything you touched today is one of these.", "FaLayerGroup"], ["When something's wrong: get, describe, logs.", "describe shows Events (why it can't start), logs shows what the app said.", "FaSearch"]], "Then straight into Lab 2. Everyone should already have minikube running from the break.");

  await labSlide("Lab 2 · Deploy, scale, break, roll out", "30 min. Everyone should already have minikube running from the break. Lead from projector. Checkpoints after apply, after port-forward shows page, after delete-pod. Most common failure: ErrImagePull = forgot image load.", "labs/02-kubernetes.md",
    ["minikube status, kubectl get nodes", "minikube image load hello-devops:v1", "kubectl apply -f k8s/ → get pods", "port-forward → browser; curl loop → hosts rotate", "scale to 4, back to 2", "delete a pod → watch it come back", "v2 rolling update, then rollout undo", "describe + logs: how to debug"],
    "You scaled to 4, killed a Pod and saw it return, rolled out v2 and rolled back.",
    ["ErrImagePull → redo step 2", "minikube stuck → minikube delete, then start", "describe pod → read the Events"], "30 min");

  // ================= CI/CD =================
  section = "CI/CD"; topic = TOPIC.ci; pres.addSection({ title: section });
  s = slide("SECTION", "Part 3 · CI/CD and Jenkins", "You did build → test → run by hand twice today. Nobody does that 40 times a day. Automate it.", "If you did it by hand twice today, a robot should do it from now on");
  s.addImage({ data: await icon("FaJenkins", H.accent3), x: 7.8, y: 1.6, w: 1.5, h: 1.5, objectName: "jenkins icon" });

  s = slide("CONTENT", "CI, CD and the other CD", "CI: every push is built and tested, so integration problems show up in minutes not months. Continuous Delivery: every green build is packaged and ready to deploy with a button. Continuous Deployment: no button, straight to prod. Pipeline stages map to what they did in labs 1-2.");
  const pipe = ["Push", "Build", "Test", "Package\n(image)", "Deploy\nstaging", "Deploy\nprod"];
  pipe.forEach((t, i) => { box(s, { x: 0.5 + i * 1.52, y: 1.3, w: 1.35, h: 0.8, t, color: i === 0 ? C.text1 : i < 4 ? topic.c : topic.tint, tc: i < 4 ? C.background1 : C.text1, size: 12, bold: true }); if (i < 5) arrow(s, 1.85 + i * 1.52, 1.7, 2.02 + i * 1.52, 1.7, topic.c); });
  [["Continuous Integration: build + test every push", 4.3, 2.25], ["Continuous Delivery: every green build is deployable (prod needs a human click)", 5.85, 2.65], ["Continuous Deployment: no click, green = live in production", 7.5, 3.05]].forEach(([t, w, y], i) => {
    s.addShape(pres.ShapeType.roundRect, { x: 2.0, y, w, h: 0.35, rectRadius: 0.05, fill: { color: topic.tint }, line: { color: topic.tint }, objectName: "span " + i });
    text(s, t, { x: 2.1, y, w: w - 0.2, h: 0.35, fontSize: 11, bold: true, color: topic.c, valign: "middle" });
  });
  bullets(s, ["Trigger: a git push or a pull request", "Runs on a fresh machine every time: no \"works on my machine\"", "Red = you find out in 2 minutes, not after merging to main", "Lab 1 + Lab 2 by hand = exactly what a pipeline automates"], { x: 0.5, y: 3.6, w: 9, h: 1.4, fontSize: 14 });

  s = slide("CONTENT", "Anatomy of any pipeline", "Tool-agnostic vocabulary first, then the YAML. Trigger → pipeline (one run) → jobs (parallel, each on a fresh runner) → steps (sequential commands) → artefacts (image, test report). Same words in Actions, Jenkins, GitLab CI.");
  stepRow(s, ["Trigger\npush, PR, schedule", "Runner\na fresh VM or container", "Job\nruns on one runner", "Steps\ncommands, in order", "Artefact\nimage, report, binary"], { y: 1.3, color: topic.c, tint: topic.tint, h: 1.0, size: 11 });
  await card(s, { x: 0.5, y: 2.6, w: 4.4, h: 2.3, title: "Rules of a good pipeline", body: ["Fast: fail in minutes, not hours", "Fresh: nothing left over from last run", "Same every time: it's code, in git", "Red blocks the merge, green allows it"], ic: "FaCheckDouble" });
  await card(s, { x: 5.1, y: 2.6, w: 4.4, h: 2.3, title: "Same words, every tool", body: ["GitHub Actions: workflow → job → step", "Jenkins: pipeline → stage → step", "GitLab CI: pipeline → stage → job", "Learn the shape once; tools are syntax"], ic: "FaTools" });

  s = slide("CONTENT", ".github/workflows/ci.yml, annotated", "Anatomy: on (trigger), jobs, runs-on (a fresh ubuntu VM GitHub provides), steps (uses = reusable action from marketplace, run = shell). Same steps as lab 1 typed by hand.");
  code(s, "name: CI\non: [push, pull_request]\n\njobs:\n  test-and-build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 20 }\n      - run: npm install\n        working-directory: app\n      - run: npm test\n        working-directory: app\n      - run: docker build -t hello-devops:$GITHUB_SHA .\n        working-directory: app", { x: 0.5, y: 1.15, w: 5.2, h: 3.9, fontSize: 10 });
  [["on", "Trigger: any push, and every pull request"],["jobs", "Units of work; each on its own fresh VM"], ["runs-on", "GitHub lends you an Ubuntu VM for this job"], ["uses", "A reusable action from the marketplace"], ["run", "A shell command: exactly what you typed in Lab 1"]].forEach(([k, v], i) => { box(s, { x: 5.95, y: 1.15 + i * 0.78, w: 1.1, h: 0.6, t: k, color: topic.c, tc: C.background1, size: 11, bold: true, font: MONO }); text(s, v, { x: 7.15, y: 1.15 + i * 0.78, w: 2.35, h: 0.6, fontSize: 11, valign: "middle" }); });

  s = slide("CONTENT", "Why it matters: the pull request gate", "This is the social contract of CI: the PR shows a red/green check from the pipeline; branch protection can make merging impossible while red. Lab 3 does exactly this flow with a deliberately broken test.");
  stepRow(s, ["You push\na branch", "Pipeline runs\nautomatically", "Result shows\non the PR", "Red: fix and\npush again", "Green: reviewer\nmerges to main"], { y: 1.3, color: topic.c, tint: topic.tint, h: 1.0, size: 11 });
  box(s, { x: 0.5, y: 2.7, w: 4.4, h: 1.0, t: "❌  Run tests failed  ·  AssertionError: expected 'ok'\nMerging is blocked", color: TINT.bad, tc: H.accent5, size: 12, bold: true });
  box(s, { x: 5.1, y: 2.7, w: 4.4, h: 1.0, t: "✅  All checks have passed  ·  test-and-build 58s\nMerge pull request", color: TINT.good, tc: H.accent6, size: 12, bold: true });
  bullets(s, ["Nobody has to remember to run the tests: the robot always does", "main stays green, so main is always deployable", "Reviewers review code, not whether it compiles"], { x: 0.5, y: 3.9, w: 9, h: 1.1, fontSize: 13 });

  s = slide("CONTENT", "Jenkins: the self-hosted original", "Jenkins = open-source automation server you run yourself (2011, from Hudson). Controller (web UI, schedules jobs) + agents (do the work). 1800+ plugins. Jobs: Freestyle (click in UI) or Pipeline (Jenkinsfile in repo, Groovy). Show the Jenkinsfile next to ci.yml: same stages.");
  box(s, { x: 0.5, y: 1.2, w: 2.2, h: 1.0, t: "Git repo\n(webhook or polling)", color: C.text1, tc: C.background1, size: 11, bold: true });
  arrow(s, 2.7, 1.7, 3.2, 1.7, topic.c);
  box(s, { x: 3.2, y: 1.2, w: 2.6, h: 1.0, t: "Jenkins controller\nweb UI · job scheduler · plugins", color: topic.c, tc: C.background1, size: 11, bold: true });
  arrow(s, 5.8, 1.5, 6.4, 1.3, topic.c); arrow(s, 5.8, 1.9, 6.4, 2.1, topic.c);
  box(s, { x: 6.4, y: 1.05, w: 1.5, h: 0.5, t: "agent 1", color: topic.tint, size: 11, bold: true });
  box(s, { x: 6.4, y: 1.9, w: 1.5, h: 0.5, t: "agent 2", color: topic.tint, size: 11, bold: true });
  text(s, "agents run the stages\n(build, test, docker)", { x: 8.0, y: 1.2, w: 1.5, h: 1.0, fontSize: 10, color: C.text2, valign: "middle" });
  code(s, "pipeline {\n  agent any\n  tools { nodejs \"node20\" }\n  stages {\n    stage(\"Checkout\") { steps { checkout scm } }\n    stage(\"Install\")  { steps { dir(\"app\") { sh \"npm install\" } } }\n    stage(\"Test\")     { steps { dir(\"app\") { sh \"npm test\" } } }\n    stage(\"Build image\") {\n      steps { dir(\"app\") {\n        sh \"docker build -t hello-devops:${BUILD_NUMBER} .\"\n      } }\n    }\n  }\n}", { x: 0.5, y: 2.45, w: 5.4, h: 2.6, fontSize: 9 });
  await card(s, { x: 6.1, y: 2.45, w: 3.4, h: 2.6, title: "Why it still matters", body: ["You own it: on-prem, air-gapped, any cloud", "1800+ plugins, any tool", "Most large companies run it", "Jenkinsfile lives in git, like ci.yml"], ic: "FaJenkins" });

  s = slide("CONTENT", "GitHub Actions vs Jenkins", "Same job, different trade-offs. Today students do Actions (zero setup); Jenkins is demoed. Message: learn the concepts, the tool is a detail; you'll also meet GitLab CI, Azure DevOps, CircleCI.");
  const cmp = [["", "GitHub Actions", "Jenkins"], ["Who hosts it", "GitHub", "You (server / VM / container)"], ["Config", "YAML in .github/workflows/", "Jenkinsfile (Groovy) or clicks in the UI"], ["Setup time", "Zero", "Install, plugins, agents, upgrades"], ["Runners", "GitHub's VMs (or self-hosted)", "Your agents"], ["Best for", "Projects already on GitHub", "On-prem, custom infra, legacy, regulated"], ["Cost", "Free minutes, then pay per minute", "Free software, you pay for machines + people"]];
  s.addTable(cmp.map((r, ri) => r.map((c, ci) => ({ text: c, options: { bold: ri === 0 || ci === 0, fontSize: 12, color: ri === 0 ? H.lt1 : H.dk1, fill: { color: ri === 0 ? H.dk1 : "FFFFFF" } } }))), { x: 0.5, y: 1.2, w: 9, colW: [1.8, 3.4, 3.8], rowH: 0.42, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, margin: 0.06, valign: "middle", objectName: "compare table" });
  keyline(s, "Same concepts everywhere: trigger → jobs → steps → artefact. Also: GitLab CI, Azure DevOps, CircleCI, ArgoCD.");

  await quiz("Quick check · CI/CD", ["A teammate says \"the tests pass on my laptop\" but CI is red. Who is right, and why does that matter?", "What's the difference between Continuous Delivery and Continuous Deployment?", "Where does the pipeline definition live, and why there?"], "1 CI is right: it runs on a fresh machine with only what's in git. 2 Delivery: deployable, human clicks. Deployment: auto to prod. 3 In the repo (.github/workflows or Jenkinsfile): versioned, reviewed, same for everyone.");

  await recap("CI/CD · 3 things to remember", [["Every push is built and tested on a fresh machine, automatically.", "That's Continuous Integration. Problems surface in minutes, and 'works on my machine' stops being an excuse.", "FaCogs"], ["The pipeline is code in the repo: trigger → jobs → steps.", "ci.yml and Jenkinsfile describe the same stages you ran by hand in Lab 1.", "FaFileCode"], ["Red blocks the merge, green makes main deployable.", "Continuous Delivery keeps a releasable build ready; Continuous Deployment ships it with no click.", "FaCheckDouble"]], "Then Lab 3.");

  await labSlide("Lab 3 · A pipeline on every push", "12 min. Students: Actions on their fork. Push, watch green. Break /health, push, watch red on the PR. Then 3-min Jenkins demo from instructor laptop (already set up!).", "labs/03-cicd.md",
    ["Read .github/workflows/ci.yml", "Branch, commit anything, push to your fork", "Actions tab → watch it go green", "Break /health on purpose, push → red", "Open a PR → see the red check block it", "Fix, push → green", "Instructor: the same stages in Jenkins"],
    "Your fork's Actions tab shows one green run and one red run.",
    ["Actions tab empty → enable workflows", "Pushed to main? It triggers too", "Unexpected red? Read the failed step"], "12 min");

  // ================= WRAP =================
  section = "Wrap-up"; topic = { c: C.text1, hex: H.dk1, tint: TINT.grey, name: "Wrap-up" }; pres.addSection({ title: section });
  s = slide("CONTENT", "The big picture: today, end to end", "Tie it together. In real teams, step 4 is a registry (Docker Hub / GHCR) and step 5 is a real cluster (EKS/GKE/AKS), often driven by ArgoCD. Everything else is identical to what they did. Colours match the sections.");
  const flow = [["git push", "FaGithub", C.text1], ["CI runs\ntests", "FaCogs", TOPIC.ci.c], ["docker\nbuild", "FaDocker", TOPIC.docker.c], ["image →\nregistry", "FaCloudUploadAlt", TOPIC.docker.c], ["kubectl\napply", "SiKubernetes", TOPIC.k8s.c], ["Pods serve\nusers", "FaUsers", C.accent6]];
  for (let i = 0; i < flow.length; i++) {
    const x = 0.5 + i * 1.52;
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.3, y: 1.3, w: 0.75, h: 0.75, fill: { color: flow[i][2] }, line: { color: flow[i][2] }, objectName: "flow circle " + i });
    s.addImage({ data: await icon(flow[i][1], "FFFFFF"), x: x + 0.475, y: 1.475, w: 0.4, h: 0.4, objectName: "flow icon " + i });
    text(s, flow[i][0], { x, y: 2.15, w: 1.35, h: 0.6, fontSize: 12, bold: true, align: "center" });
    if (i < flow.length - 1) arrow(s, x + 1.1, 1.67, x + 1.47, 1.67);
  }
  const did = [["Lab 1", "You did step 3 by hand: built the image and ran it", TOPIC.docker.c], ["Lab 3", "The pipeline did steps 2–3 for you, on every push", TOPIC.ci.c], ["Lab 2", "You did steps 5–6 on minikube: scale, heal, roll out, roll back", TOPIC.k8s.c], ["Next", "A registry + a real cluster (EKS / GKE / AKS) + ArgoCD = production", C.text1]];
  did.forEach(([k, v, c], i) => { box(s, { x: 0.5 + (i % 2) * 4.6, y: 3.0 + Math.floor(i / 2) * 0.95, w: 0.9, h: 0.75, t: k, color: c, tc: C.background1, size: 12, bold: true }); text(s, v, { x: 1.5 + (i % 2) * 4.6, y: 3.0 + Math.floor(i / 2) * 0.95, w: 3.4, h: 0.75, fontSize: 13, valign: "middle" }); });

  s = slide("CONTENT", "Where to go from here", "Point them at one thing each. Play with Kubernetes is free and needs nothing installed. Emphasise: put the repo on your GitHub with the green Actions badge; it's a portfolio item.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 3.6, title: "Docker", body: ["Docker Compose: multi-container apps (app + DB)", "Volumes: data that survives rm", "Multi-stage builds: tiny images", "docs.docker.com/get-started"], ic: "FaDocker", color: TOPIC.docker.c, tint: TOPIC.docker.tint });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 3.6, title: "Kubernetes", body: ["ConfigMaps + Secrets", "Ingress: real URLs", "Helm: package K8s apps", "kubernetes.io/docs/tutorials", "Play with K8s: labs.play-with-k8s.com"], ic: "SiKubernetes", color: TOPIC.k8s.c, tint: TOPIC.k8s.tint });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 3.6, title: "CI/CD + beyond", body: ["Push images to GHCR from Actions", "ArgoCD: GitOps deploys", "Terraform: infra as code", "Prometheus + Grafana: monitoring", "roadmap.sh/devops"], ic: "FaRoad", color: TOPIC.ci.c, tint: TOPIC.ci.tint });

  s = slide("TITLE", "Thanks. Questions?", "Q&A. Keep the repo URL up. Ask them to star/fork it and finish the challenges at home.", "Fork the repo, keep the Codespace, finish the challenges at home.\nShow the green Actions badge on your GitHub profile.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch(e => { console.error(e); process.exit(1); });
