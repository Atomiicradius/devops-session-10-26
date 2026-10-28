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
pres.title = "Kubernetes from Zero: a 4-hour course";
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
const FOOT = { text: "Kubernetes from Zero  ·  components · kubectl · YAML · namespaces · ingress · helm · volumes · services", options: { x: 0.5, y: 5.2, w: 6, h: 0.3, fontSize: 9, color: H.dk2, margin: 0 } };
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
  const K = TOPIC.k8s;
  const LIGHT = "C4B5FD"; // mid-tone violet for secondary boxes
  function annotated(s, codeStr, rows, codeW, fs) { // code left + keyword/explanation rows right
    code(s, codeStr, { x: 0.5, y: 1.15, w: codeW || 4.6, h: 3.9, fontSize: fs || 9.5 });
    const x0 = 0.5 + (codeW || 4.6) + 0.25, pitch = Math.min(0.65, 3.9 / rows.length);
    rows.forEach(([k, v], i) => { box(s, { x: x0, y: 1.15 + i * pitch, w: 1.45, h: pitch - 0.13, t: k, color: K.c, tc: C.background1, size: 10, bold: true, font: MONO }); text(s, v, { x: x0 + 1.55, y: 1.15 + i * pitch, w: 9.5 - x0 - 1.55, h: pitch - 0.13, fontSize: 10.5, valign: "middle" }); });
  }
  function pod(s, x, y, t, w, h) { box(s, { x, y, w: w || 0.9, h: h || 0.55, t, color: K.c, tc: C.background1, size: 10, bold: true }); }

  // ================= 0. OVERVIEW =================
  pres.addSection({ title: "Intro" }); section = "Intro"; topic = NEUTRAL;
  let s = slide("TITLE", "Kubernetes from Zero", "0:00 Course overview. Prerequisite: basic Docker (image, container, docker run). By the end: you can read and write K8s YAML, run a two-service app on minikube, organise it with namespaces, expose it with Ingress, persist its data, and understand Helm and StatefulSets.", "A 4-hour course · what Kubernetes is, how it's built, and how to run a real app on it");
  s.addImage({ data: await icon("SiKubernetes", H.accent4), x: 8.2, y: 0.7, w: 1.1, h: 1.1, objectName: "k8s icon" });
  box(s, { x: 0.6, y: 4.3, w: 8.8, h: 0.6, t: "Structure based on 'Kubernetes Tutorial for Beginners' by TechWorld with Nana  ·  demo project: MongoDB + Mongo Express on minikube", color: "1E293B", tc: "E2E8F0", size: 12 });

  s = slide("CONTENT", "Course overview", "14 sections in three arcs. Arc 1 is pure concepts (no typing). Arc 2 is hands-on: minikube, kubectl, YAML, the demo project. Arc 3 is the 'next level' features you meet in every real cluster.");
  const arcs = [["1 · Concepts", ["What is Kubernetes", "Main components", "Architecture"], "FaLightbulb"], ["2 · Hands-on", ["minikube + kubectl setup", "Main kubectl commands", "YAML configuration files", "Demo: MongoDB + Mongo Express"], "FaTerminal"], ["3 · Real-cluster features", ["Namespaces", "Ingress", "Helm", "Volumes", "StatefulSet", "Services in depth"], "FaLayerGroup"]];
  for (let i = 0; i < 3; i++) await card(s, { x: 0.5 + i * 3.07, y: 1.2, w: 2.85, h: 3.1, title: arcs[i][0], body: arcs[i][1], ic: arcs[i][2], color: K.c, tint: K.tint });
  keyline(s, "Prerequisite: you know what a Docker image and a container are. Everything else is explained here.", C.text1);

  // ================= 1. WHAT IS K8S =================
  section = "What is K8s"; topic = K; pres.addSection({ title: section });
  s = slide("SECTION", "1 · What is Kubernetes?", "2:18. Open-source container orchestration tool, originally from Google (Borg), now CNCF. Manages containerised applications across many machines, in any environment: physical, virtual, cloud, hybrid.", "An open-source container orchestration platform");
  s.addImage({ data: await icon("SiKubernetes", H.accent4), x: 7.8, y: 1.6, w: 1.5, h: 1.5, objectName: "k8s icon" });

  s = slide("CONTENT", "Why orchestration became necessary", "The trend: monolith → microservices → hundreds of containers → managing them by hand (scripts, SSH) doesn't scale. An orchestrator handles the lifecycle so humans don't.");
  stepRow(s, ["Monolith\none app, one server", "Microservices\n10s of small services", "Containers\n100s of running\ncontainers", "Many servers\nwho runs what,\nwhere?", "Orchestrator\nKubernetes"], { y: 1.3, color: K.c, tint: K.tint, h: 1.1, size: 11 });
  await card(s, { x: 0.5, y: 2.65, w: 4.4, h: 2.25, title: "What an orchestrator gives you", body: ["High availability: no downtime for users", "Scalability: more copies when load rises, fewer when it drops", "Disaster recovery: restore state from backup and keep running"], ic: "FaShieldAlt" });
  await card(s, { x: 5.1, y: 2.65, w: 4.4, h: 2.25, title: "Where it runs", body: ["Physical servers in your data centre", "Virtual machines", "Any cloud: AWS, GCP, Azure (managed: EKS, GKE, AKS)", "Hybrid: a mix of all of them"], ic: "FaCloud" });

  // ================= 2. MAIN COMPONENTS =================
  section = "Main components"; pres.addSection({ title: section });
  s = slide("SECTION", "2 · Main Kubernetes components", "5:20. Built up with the running example: a JavaScript web app + a database. Node → Pod → Service → Ingress → ConfigMap / Secret → Volumes → Deployment / StatefulSet. Each one answers a concrete question about the app.", "Pod · Service · Ingress · ConfigMap · Secret · Volume · Deployment · StatefulSet");

  s = slide("CONTENT", "Node and Pod", "Node = a worker machine (VM or physical). Pod = smallest unit of K8s, an abstraction over a container: usually one app container per Pod. Each Pod gets its own internal IP from the cluster's virtual network. Pods are ephemeral: when one dies a new one is created with a NEW IP. That's the problem the next component solves.");
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.2, w: 5.2, h: 3.1, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "node box" });
  text(s, "Node (worker machine)", { x: 0.65, y: 1.27, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  s.addShape(pres.ShapeType.roundRect, { x: 0.7, y: 1.7, w: 2.3, h: 2.4, rectRadius: 0.1, fill: { color: K.tint }, line: { color: K.tint }, objectName: "pod1" });
  text(s, "Pod: my-app\nIP 10.244.0.5", { x: 0.8, y: 1.75, w: 2.1, h: 0.5, fontSize: 11, bold: true, color: K.c, align: "center" });
  box(s, { x: 0.95, y: 2.4, w: 1.8, h: 0.9, t: "container\nnode app", color: K.c, tc: C.background1, size: 11, bold: true });
  text(s, "(one app container per Pod, usually)", { x: 0.8, y: 3.4, w: 2.1, h: 0.5, fontSize: 9, color: C.text2, align: "center", italic: true });
  s.addShape(pres.ShapeType.roundRect, { x: 3.2, y: 1.7, w: 2.3, h: 2.4, rectRadius: 0.1, fill: { color: K.tint }, line: { color: K.tint }, objectName: "pod2" });
  text(s, "Pod: database\nIP 10.244.0.9", { x: 3.3, y: 1.75, w: 2.1, h: 0.5, fontSize: 11, bold: true, color: K.c, align: "center" });
  box(s, { x: 3.45, y: 2.4, w: 1.8, h: 0.9, t: "container\nmongodb", color: K.c, tc: C.background1, size: 11, bold: true });
  await card(s, { x: 6.0, y: 1.2, w: 3.5, h: 3.1, title: "Pod", body: ["Smallest unit in K8s", "Abstraction over a container: you don't touch Docker directly", "Own IP from the cluster's internal network", "Ephemeral: dies → replaced by a NEW Pod with a NEW IP", "So: never address a Pod by IP"], ic: "FaCube", bodySize: 12 });
  keyline(s, "Node = machine. Pod = the running unit on it. Pods are mortal, which is why the next component exists.");

  s = slide("CONTENT", "Service and Ingress", "Service = a permanent IP + DNS name attached to a set of Pods; its lifecycle is independent of Pods. Also a load balancer. Internal service for the DB (ClusterIP); external service for the app (reachable from outside). But the external URL is http://node-ip:port, ugly. Ingress gives a real domain + HTTPS and forwards to the Service.");
  box(s, { x: 0.5, y: 1.3, w: 1.6, h: 0.8, t: "Browser\nmy-app.com", color: TINT.grey, size: 11, bold: true });
  arrow(s, 2.1, 1.7, 2.6, 1.7, K.c);
  box(s, { x: 2.6, y: 1.3, w: 1.7, h: 0.8, t: "Ingress\nroutes by host / path", color: K.c, tc: C.background1, size: 11, bold: true });
  arrow(s, 4.3, 1.7, 4.8, 1.7, K.c);
  box(s, { x: 4.8, y: 1.3, w: 1.9, h: 0.8, t: "Service: my-app\n(external)", color: LIGHT, size: 11, bold: true });
  arrow(s, 6.7, 1.7, 7.2, 1.7, K.c);
  pod(s, 7.2, 1.3, "Pod\nmy-app", 1.0, 0.8); pod(s, 8.4, 1.3, "Pod\nmy-app", 1.0, 0.8);
  box(s, { x: 4.8, y: 2.5, w: 1.9, h: 0.8, t: "Service: mongodb\n(internal only)", color: LIGHT, size: 11, bold: true });
  arrow(s, 6.7, 2.9, 7.2, 2.9, K.c); pod(s, 7.2, 2.5, "Pod\nmongodb", 1.0, 0.8);
  arrow(s, 7.7, 2.1, 5.75, 2.5, K.c); text(s, "app talks to the DB by Service name", { x: 5.0, y: 2.1, w: 2.4, h: 0.3, fontSize: 9, color: C.text2, italic: true });
  await card(s, { x: 0.5, y: 2.5, w: 4.0, h: 2.4, title: "Service", body: ["Stable IP + DNS name; outlives Pods", "Load-balances across the Pods it selects", "Internal (ClusterIP) for databases", "External (NodePort / LoadBalancer) for apps"], ic: "FaNetworkWired", bodySize: 11 });
  box(s, { x: 4.8, y: 3.5, w: 4.7, h: 1.4, t: "Ingress: the entry point for external traffic.\nmy-app.com → Service → Pods.  Handles domains, paths, TLS.\nWithout it you'd expose http://<node-ip>:30XXX.", color: K.tint, size: 11 });

  s = slide("CONTENT", "ConfigMap and Secret", "Problem: the DB URL is in the app image. Change the DB name → rebuild, push, redeploy. ConfigMap = external configuration (plain key-values like DB_URL) mounted into Pods as env vars or files. Secret = same, but for credentials; base64-encoded by default (NOT encrypted; enable encryption at rest or use a secret manager). Pods read both as env vars.");
  await card(s, { x: 0.5, y: 1.2, w: 4.4, h: 2.3, title: "ConfigMap", body: ["External configuration for your app", "Plain key / values: DB_URL=mongodb-service", "Change config without rebuilding the image", "Consumed as env vars or mounted files"], ic: "FaCog", bodySize: 12 });
  await card(s, { x: 5.1, y: 1.2, w: 4.4, h: 2.3, title: "Secret", body: ["For sensitive data: passwords, tokens, certs", "base64-encoded: encoding, not encryption", "Enable encryption at rest, or use Vault / KMS", "Never commit real secrets to git"], ic: "FaKey", color: C.accent5, tint: TINT.bad, bodySize: 12 });
  box(s, { x: 0.5, y: 3.75, w: 1.6, h: 0.95, t: "ConfigMap\nDB_URL", color: K.tint, size: 11, bold: true });
  box(s, { x: 2.3, y: 3.75, w: 1.6, h: 0.95, t: "Secret\nDB_USER, DB_PWD", color: TINT.bad, size: 11, bold: true });
  arrow(s, 3.9, 4.22, 4.4, 4.22, K.c);
  pod(s, 4.4, 3.75, "Pod my-app\nenv: DB_URL, DB_USER, DB_PWD", 3.0, 0.95);
  text(s, "the image never changes;\nonly the config does", { x: 7.6, y: 3.75, w: 1.9, h: 0.95, fontSize: 10, color: C.text2, valign: "middle", italic: true });

  s = slide("CONTENT", "Volumes", "Problem: the DB Pod restarts → data gone, because Pod storage is ephemeral. Volume = storage attached to the Pod from outside: a directory on the node, or remote storage (cloud disk, NFS) outside the cluster. Key message from the course: Kubernetes does NOT manage data persistence for you; you must configure it. Covered in depth in section 12.");
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.2, w: 5.0, h: 2.7, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "cluster box" });
  text(s, "Kubernetes cluster", { x: 0.65, y: 1.27, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  pod(s, 0.8, 1.75, "Pod mongodb\n(restarts, moves, dies)", 2.2, 1.0);
  box(s, { x: 3.3, y: 1.75, w: 2.0, h: 1.0, t: "Volume\n/data/db", color: K.tint, size: 11, bold: true });
  arrow(s, 3.0, 2.25, 3.3, 2.25, K.c);
  arrow(s, 4.3, 2.75, 4.3, 3.2, K.c);
  box(s, { x: 3.3, y: 3.2, w: 2.0, h: 0.55, t: "node disk / cloud disk / NFS", color: C.text1, tc: C.background1, size: 10, bold: true });
  await card(s, { x: 5.8, y: 1.2, w: 3.7, h: 2.7, title: "Volumes", body: ["Attach physical storage to a Pod", "Local (on the node) or remote (outside the cluster)", "Data survives Pod restarts and rescheduling", "K8s doesn't manage persistence: you configure it"], ic: "FaDatabase", bodySize: 12 });
  keyline(s, "Think of the volume as an external hard drive plugged into the cluster.");

  s = slide("CONTENT", "Deployment and StatefulSet", "Problem: one app Pod dies → downtime. Solution: replicas. You don't create Pods; you create a Deployment that says 'N replicas of this Pod template'. Deployment = blueprint for stateless apps. But databases have state and must not be replicated naively (data inconsistency). StatefulSet = the Deployment for stateful apps: ordered Pods, stable names, each with its own storage. Course verdict: DBs are often hosted outside K8s for this reason.");
  await card(s, { x: 0.5, y: 1.2, w: 4.4, h: 2.6, title: "Deployment", body: ["\"Run N replicas of this Pod template\"", "For stateless apps (web, API)", "Pods are interchangeable", "Scale, roll out, roll back", "Service in front spreads the load"], ic: "FaLayerGroup" });
  await card(s, { x: 5.1, y: 1.2, w: 4.4, h: 2.6, title: "StatefulSet", body: ["For stateful apps: databases, queues", "Pods get stable names: mongo-0, mongo-1", "Each Pod gets its own persistent volume", "Ordered start / stop", "Harder: replication, leader election are your job"], ic: "FaDatabase" });
  keyline(s, "Rule of thumb: stateless → Deployment. Stateful → StatefulSet, or run the database outside the cluster.");

  s = slide("CONTENT", "All components, one picture", "Recap of section 2: the full app on K8s. Browser → Ingress → external Service → app Pods (Deployment, 2 replicas) → internal Service → db Pod (StatefulSet) → Volume. App Pods read config from ConfigMap/Secret.");
  box(s, { x: 0.5, y: 1.3, w: 1.3, h: 0.7, t: "Browser", color: TINT.grey, size: 11, bold: true });
  arrow(s, 1.8, 1.65, 2.2, 1.65, K.c);
  box(s, { x: 2.2, y: 1.3, w: 1.3, h: 0.7, t: "Ingress", color: K.c, tc: C.background1, size: 11, bold: true });
  arrow(s, 3.5, 1.65, 3.9, 1.65, K.c);
  box(s, { x: 3.9, y: 1.3, w: 1.5, h: 0.7, t: "Service\nmy-app", color: LIGHT, size: 11, bold: true });
  arrow(s, 5.4, 1.5, 5.8, 1.3, K.c); arrow(s, 5.4, 1.8, 5.8, 2.1, K.c);
  pod(s, 5.8, 1.05, "Pod my-app", 1.4, 0.5); pod(s, 5.8, 1.85, "Pod my-app", 1.4, 0.5);
  text(s, "Deployment · 2 replicas", { x: 5.7, y: 2.4, w: 1.7, h: 0.25, fontSize: 9, color: C.text2, align: "center", italic: true });
  arrow(s, 7.2, 1.65, 7.6, 1.65, K.c);
  box(s, { x: 7.6, y: 1.3, w: 1.9, h: 0.7, t: "Service\nmongodb (internal)", color: LIGHT, size: 10, bold: true });
  arrow(s, 8.55, 2.0, 8.55, 2.5, K.c);
  pod(s, 7.6, 2.5, "Pod mongodb-0", 1.9, 0.5);
  text(s, "StatefulSet", { x: 7.6, y: 3.02, w: 1.9, h: 0.25, fontSize: 9, color: C.text2, align: "center", italic: true });
  arrow(s, 8.55, 3.3, 8.55, 3.7, K.c);
  box(s, { x: 7.6, y: 3.7, w: 1.9, h: 0.55, t: "Volume", color: K.tint, size: 11, bold: true });
  box(s, { x: 3.9, y: 3.0, w: 1.5, h: 0.55, t: "ConfigMap", color: K.tint, size: 11, bold: true });
  box(s, { x: 3.9, y: 3.65, w: 1.5, h: 0.55, t: "Secret", color: TINT.bad, size: 11, bold: true });
  arrow(s, 5.4, 3.27, 5.9, 2.4, K.c); arrow(s, 5.4, 3.92, 6.0, 2.4, K.c);
  text(s, "env vars", { x: 5.5, y: 3.85, w: 1.0, h: 0.3, fontSize: 9, color: C.text2, italic: true });
  keyline(s, "Pod · Service · Ingress · ConfigMap · Secret · Volume · Deployment · StatefulSet: the vocabulary for the whole course.");

  // ================= 3. ARCHITECTURE =================
  section = "Architecture"; pres.addSection({ title: section });
  s = slide("SECTION", "3 · Kubernetes architecture", "22:29. Two kinds of machines: worker nodes (do the work) and control plane / master nodes (manage the cluster). Each has specific processes.", "Worker nodes do the work. The control plane decides.");

  s = slide("CONTENT", "Worker node: three processes on every node", "1 Container runtime (containerd, CRI-O; Docker was the original) runs containers. 2 kubelet: the K8s agent; talks to the runtime AND the node; starts Pods with their containers, assigns resources. 3 kube-proxy: forwards requests from Services to Pods intelligently (prefers a Pod on the same node to avoid network hops). Worker nodes carry the application Pods and need the most resources.");
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.2, w: 5.2, h: 3.7, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "worker box" });
  text(s, "Worker node", { x: 0.65, y: 1.27, w: 4, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
  [["kubelet", "agent: talks to the runtime and the node, starts Pods, assigns resources"], ["kube-proxy", "routes Service traffic to Pods, prefers the local node"], ["container runtime", "containerd / CRI-O: actually runs the containers"]].forEach(([t, d], i) => { box(s, { x: 0.7, y: 1.7 + i * 0.75, w: 1.8, h: 0.6, t, color: K.c, tc: C.background1, size: 11, bold: true }); text(s, d, { x: 2.6, y: 1.7 + i * 0.75, w: 3.0, h: 0.6, fontSize: 10.5, valign: "middle" }); });
  pod(s, 0.7, 4.05, "Pod", 1.1, 0.6); pod(s, 1.95, 4.05, "Pod", 1.1, 0.6); pod(s, 3.2, 4.05, "Pod", 1.1, 0.6); text(s, "…", { x: 4.4, y: 4.05, w: 0.5, h: 0.6, fontSize: 14, valign: "middle" });
  await card(s, { x: 6.0, y: 1.2, w: 3.5, h: 3.7, title: "Why three", body: ["Runtime: the thing that runs containers", "kubelet: the bridge between the cluster and the machine", "kube-proxy: the bridge between Services and Pods", "Worker nodes carry the real workload and need the most CPU / RAM"], ic: "FaServer", bodySize: 12 });

  s = slide("CONTENT", "Control plane: four processes that manage the cluster", "1 API server: the cluster gateway; the only entry point; authenticates and validates every request (kubectl, UI, API). 2 Scheduler: decides WHICH node a new Pod goes on, based on resource requests and node load; kubelet does the actual starting. 3 Controller manager: detects state changes (Pod died) and asks the scheduler to reschedule. 4 etcd: the cluster brain; key-value store of all cluster state; every other component reads/writes through the API server. Application data is NOT in etcd. Production: multiple master nodes, API servers load-balanced, etcd distributed.");
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.2, w: 5.2, h: 3.7, rectRadius: 0.1, fill: { color: K.tint }, line: { color: K.tint }, objectName: "cp box" });
  text(s, "Control plane (master node)", { x: 0.65, y: 1.27, w: 4, h: 0.3, fontSize: 13, bold: true, color: K.c });
  [["API server", "the gateway: every request (kubectl, UI, API) is authenticated and validated here"], ["Scheduler", "decides WHICH node a new Pod goes on (resources, load). kubelet then starts it"], ["Controller manager", "detects state changes (a Pod died) and triggers rescheduling"], ["etcd", "the cluster brain: key-value store of ALL cluster state. Not application data"]].forEach(([t, d], i) => { box(s, { x: 0.7, y: 1.7 + i * 0.78, w: 1.8, h: 0.62, t, color: K.c, tc: C.background1, size: 11, bold: true }); text(s, d, { x: 2.6, y: 1.7 + i * 0.78, w: 3.0, h: 0.62, fontSize: 10, valign: "middle" }); });
  await card(s, { x: 6.0, y: 1.2, w: 3.5, h: 3.7, title: "How a request flows", body: ["kubectl → API server (validate)", "API server → etcd (store desired state)", "Scheduler sees unscheduled Pod → picks node", "kubelet on that node → starts the Pod", "Pod dies → controller manager → reschedule"], ic: "FaRoute", bodySize: 12 });

  s = slide("CONTENT", "Cluster setup: from laptop to production", "Example production cluster: 2 master nodes + 3 worker nodes. Masters need less CPU/RAM; workers more. You add nodes as the app grows: get a bare server, install the three worker processes, join it to the cluster. Managed clouds (EKS/GKE/AKS) run the control plane for you. Locally all of this is one machine: minikube.");
  for (let i = 0; i < 2; i++) { s.addShape(pres.ShapeType.roundRect, { x: 0.5 + i * 1.5, y: 1.3, w: 1.35, h: 1.3, rectRadius: 0.1, fill: { color: K.tint }, line: { color: K.c, width: 1 }, objectName: "master " + i }); text(s, "master " + (i + 1) + "\nAPI · sched ·\nctrl · etcd", { x: 0.5 + i * 1.5, y: 1.3, w: 1.35, h: 1.3, fontSize: 10, bold: true, color: K.c, align: "center", valign: "middle" }); }
  for (let i = 0; i < 3; i++) { s.addShape(pres.ShapeType.roundRect, { x: 4.0 + i * 1.5, y: 1.3, w: 1.35, h: 1.3, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: C.text2, width: 1 }, objectName: "worker " + i }); text(s, "worker " + (i + 1) + "\nkubelet · proxy ·\nruntime · Pods", { x: 4.0 + i * 1.5, y: 1.3, w: 1.35, h: 1.3, fontSize: 10, bold: true, color: C.text2, align: "center", valign: "middle" }); }
  text(s, "+ worker 4 when you need more capacity", { x: 8.5, y: 1.3, w: 1.1, h: 1.3, fontSize: 9, color: C.text2, valign: "middle", italic: true });
  await card(s, { x: 0.5, y: 2.9, w: 4.4, h: 2.0, title: "Production", body: ["Several masters: API servers load-balanced, etcd replicated", "Workers sized for the workload", "Managed clouds run the control plane for you"], ic: "FaCloud", bodySize: 12 });
  await card(s, { x: 5.1, y: 2.9, w: 4.4, h: 2.0, title: "Learning (this course)", body: ["minikube: master + worker processes on ONE machine", "Runs as a container or VM on your laptop", "Same kubectl, same YAML, same concepts"], ic: "FaLaptop", bodySize: 12 });

  // ================= 4. MINIKUBE + KUBECTL =================
  section = "Local setup"; pres.addSection({ title: section });
  s = slide("SECTION", "4 · minikube and kubectl: local setup", "34:47. minikube = a one-node cluster on your machine (master and worker processes together), running in Docker or a VM. kubectl = the CLI that talks to ANY cluster's API server, including minikube's.", "A one-node cluster on your laptop, and the CLI to talk to it");

  s = slide("CONTENT", "What minikube and kubectl are", "minikube: a tool that creates a single-node cluster on your laptop, where master and worker processes run together. Needs a driver: Docker (default now), or a hypervisor like VirtualBox / HyperKit. kubectl: the command-line client for the Kubernetes API. Works with minikube, a cloud cluster, anything. minikube installs kubectl as a dependency.");
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.2, w: 5.4, h: 3.0, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "laptop box" });
  text(s, "Your laptop", { x: 0.65, y: 1.27, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  box(s, { x: 0.7, y: 1.7, w: 1.6, h: 0.9, t: "kubectl\n(CLI client)", color: K.tint, size: 11, bold: true });
  arrow(s, 2.3, 2.15, 2.9, 2.15, K.c);
  s.addShape(pres.ShapeType.roundRect, { x: 2.9, y: 1.65, w: 2.85, h: 2.4, rectRadius: 0.1, fill: { color: K.tint }, line: { color: K.tint }, objectName: "mk box" });
  text(s, "minikube node (Docker container or VM)", { x: 3.0, y: 1.7, w: 2.7, h: 0.3, fontSize: 10, bold: true, color: K.c });
  box(s, { x: 3.0, y: 2.05, w: 2.65, h: 0.55, t: "control plane: API · sched · ctrl · etcd", color: K.c, tc: C.background1, size: 9, bold: true });
  box(s, { x: 3.0, y: 2.7, w: 2.65, h: 0.55, t: "worker: kubelet · proxy · runtime", color: LIGHT, size: 9, bold: true });
  pod(s, 3.0, 3.35, "Pod", 0.8, 0.5); pod(s, 3.9, 3.35, "Pod", 0.8, 0.5); pod(s, 4.8, 3.35, "Pod", 0.85, 0.5);
  await card(s, { x: 6.2, y: 1.2, w: 3.3, h: 3.0, title: "Two tools", body: ["minikube: creates and manages the local cluster", "kubectl: talks to the API server of ANY cluster", "Later: kubectl config use-context switches between minikube and a cloud cluster"], ic: "FaTools", bodySize: 12 });
  keyline(s, "minikube is only for learning and testing. kubectl is what you'll use for the rest of your career.");

  s = slide("CONTENT", "Install and start", "Mac: brew install minikube (pulls kubectl). Windows: choco / winget. Linux: curl the binary. Docker Desktop must be running if you use the docker driver. minikube start creates the node; first run downloads the image (~1 min). Verify: kubectl get nodes shows one node Ready; minikube status shows host/kubelet/apiserver Running.");
  code(s, "# macOS\nbrew install minikube          # installs kubectl too\n\n# start a cluster (docker driver, the default)\nminikube start --driver=docker\n\n# verify\nkubectl get nodes\n# NAME       STATUS   ROLES           AGE   VERSION\n# minikube   Ready    control-plane   40s   v1.31.0\n\nminikube status\n# host: Running  kubelet: Running  apiserver: Running  kubeconfig: Configured\n\nkubectl version      # client + server versions", { x: 0.5, y: 1.15, w: 5.6, h: 3.9, fontSize: 9.5 });
  await card(s, { x: 6.3, y: 1.15, w: 3.2, h: 3.9, title: "Useful minikube commands", body: ["minikube stop / start", "minikube delete (fresh cluster)", "minikube dashboard (web UI)", "minikube service <name> (open a NodePort)", "minikube ip", "minikube addons enable ingress"], ic: "FaTerminal", bodySize: 12 });

  // ================= 5. KUBECTL COMMANDS =================
  section = "kubectl"; pres.addSection({ title: section });
  s = slide("SECTION", "5 · Main kubectl commands", "44:52. CRUD on components, status, debugging, and applying config files. Demo: create an nginx Deployment, see the Pod, edit it, see a rollout, debug with logs/describe/exec, delete, then do the same with a YAML file.", "Create, read, update, delete, debug");

  s = slide("CONTENT", "You work with Deployments, not Pods", "kubectl create deployment nginx-depl --image=nginx creates a Deployment; it creates a ReplicaSet; the ReplicaSet creates the Pod. Names chain: nginx-depl → nginx-depl-5c8bf76b5b → nginx-depl-5c8bf76b5b-abc12. You never create the ReplicaSet or Pod directly. kubectl edit deployment opens the live YAML; change the image → a new ReplicaSet, a new Pod, old one terminated.");
  box(s, { x: 0.5, y: 1.4, w: 2.6, h: 0.9, t: "Deployment\nnginx-depl", color: K.c, tc: C.background1, size: 12, bold: true });
  arrow(s, 3.1, 1.85, 3.6, 1.85, K.c);
  box(s, { x: 3.6, y: 1.4, w: 2.6, h: 0.9, t: "ReplicaSet\nnginx-depl-5c8bf76b5b", color: LIGHT, size: 11, bold: true });
  arrow(s, 6.2, 1.85, 6.7, 1.85, K.c);
  pod(s, 6.7, 1.4, "Pod\nnginx-depl-5c8bf76b5b-abc12", 2.8, 0.9);
  text(s, "you create this", { x: 0.5, y: 2.35, w: 2.6, h: 0.3, fontSize: 10, color: K.c, align: "center", bold: true });
  text(s, "created for you: manages replicas", { x: 3.6, y: 2.35, w: 2.6, h: 0.3, fontSize: 10, color: C.text2, align: "center" });
  text(s, "created for you: the running unit", { x: 6.7, y: 2.35, w: 2.8, h: 0.3, fontSize: 10, color: C.text2, align: "center" });
  code(s, "kubectl create deployment nginx-depl --image=nginx\nkubectl get deployment            # nginx-depl   1/1\nkubectl get replicaset            # nginx-depl-5c8bf76b5b   1   1   1\nkubectl get pod                   # nginx-depl-5c8bf76b5b-abc12   Running\n\nkubectl edit deployment nginx-depl     # change image: nginx:1.27 → save\nkubectl get pod                        # new pod created, old one Terminating", { x: 0.5, y: 2.8, w: 9, h: 2.2, fontSize: 10 });

  s = slide("CONTENT", "The command families", "Four families. Create/delete (imperative). Get (status). Debug (logs, describe, exec). Apply (declarative, from a file: the way you'll really work). 'kubectl apply -f' creates if missing, updates if existing; 'kubectl delete -f' removes everything in the file.");
  const fam = [["Create & delete", ["kubectl create deployment <name> --image=<img>", "kubectl delete deployment <name>", "kubectl edit deployment <name>"], "FaPlus"], ["Status", ["kubectl get nodes | pod | service | deployment | replicaset", "kubectl get all", "kubectl get pod -o wide  (IP, node)"], "FaList"], ["Debug", ["kubectl logs <pod>", "kubectl describe pod <pod>  (events!)", "kubectl exec -it <pod> -- /bin/bash"], "FaBug"], ["Config files", ["kubectl apply -f config.yaml", "kubectl delete -f config.yaml", "kubectl get deployment <name> -o yaml"], "FaFileAlt"]];
  for (let i = 0; i < 4; i++) await card(s, { x: 0.5 + (i % 2) * 4.6, y: 1.2 + Math.floor(i / 2) * 1.9, w: 4.4, h: 1.75, title: fam[i][0], body: fam[i][1], ic: fam[i][2], bodySize: 11 });

  s = slide("CONTENT", "Debugging a Pod", "Three steps in order. logs: what the container printed. describe: the Events at the bottom tell you WHY a Pod isn't running (image pull failed, no resources, probe failing). exec -it: a shell inside the container. The course demo: a mongo Pod, logs show startup, exec in and run mongosh. Statuses you'll meet: ContainerCreating, Running, Pending, ErrImagePull / ImagePullBackOff, CrashLoopBackOff.");
  stepRow(s, ["kubectl get pod\nwhat state is it in?", "kubectl logs <pod>\nwhat did the app say?", "kubectl describe pod <pod>\nwhat did K8s say? (Events)", "kubectl exec -it <pod> -- sh\nlook around inside"], { y: 1.3, color: K.c, tint: K.tint, h: 1.1, size: 10.5 });
  const st = [["Running 1/1", "healthy", H.accent6], ["ContainerCreating / Pending", "pulling image or waiting for a node: wait, then describe", H.accent4], ["ErrImagePull / ImagePullBackOff", "image name or tag wrong, or registry needs credentials", H.accent5], ["CrashLoopBackOff", "the app starts and dies repeatedly: read the logs", H.accent5]];
  s.addTable(st.map(r => [{ text: r[0], options: { fontFace: MONO, bold: true, fontSize: 11, color: r[2] } }, { text: r[1], options: { fontSize: 12, color: H.dk1 } }]), { x: 0.5, y: 2.7, w: 9, colW: [3.4, 5.6], rowH: 0.45, border: { type: "solid", color: "E2E8F0", pt: 0.5 }, fill: { color: "FFFFFF" }, margin: 0.06, valign: "middle", objectName: "status table" });

  // ================= 6. YAML =================
  section = "YAML config"; pres.addSection({ title: section });
  s = slide("SECTION", "6 · The Kubernetes YAML configuration file", "1:02:03. Every config file has 3 parts: metadata, specification, status (generated). Plus apiVersion and kind. Demo: nginx Deployment + Service, connect them with labels/selectors, verify with describe and -o yaml.", "metadata · spec · status, connected by labels and selectors");

  s = slide("CONTENT", "Every config file has the same three parts", "1 metadata: name, labels. 2 spec: the desired state; its attributes depend on the kind. 3 status: added by Kubernetes automatically; it compares desired (spec) to actual (status) continuously; that's self-healing. The data for status comes from etcd. Also apiVersion + kind at the top. Store these files with your code or in a separate config repo (GitOps).");
  code(s, "apiVersion: apps/v1          # API group/version for this kind\nkind: Deployment             # what you're describing\nmetadata:                    # 1 · identity\n  name: nginx-deployment\n  labels:\n    app: nginx\nspec:                        # 2 · desired state (depends on kind)\n  replicas: 2\n  selector: ...\n  template: ...\nstatus:                      # 3 · actual state, written by K8s\n  availableReplicas: 2       #     compared to spec forever\n  readyReplicas: 2           #     (seen with kubectl get -o yaml)", { x: 0.5, y: 1.15, w: 5.4, h: 3.9, fontSize: 9.5 });
  [["metadata", "name + labels: how things find each other"], ["spec", "what you want: replicas, image, ports"], ["status", "what K8s observes. Desired ≠ actual → K8s acts"], ["apiVersion / kind", "apps/v1 Deployment, v1 Service / Pod / ConfigMap"]].forEach(([k, v], i) => { box(s, { x: 6.15, y: 1.15 + i * 0.95, w: 1.5, h: 0.8, t: k, color: K.c, tc: C.background1, size: 10, bold: true, font: MONO }); text(s, v, { x: 7.75, y: 1.15 + i * 0.95, w: 1.75, h: 0.8, fontSize: 10.5, valign: "middle" }); });

  s = slide("CONTENT", "Deployment: a template inside a spec", "The Deployment spec contains a template, which is the Pod's own config (its metadata + spec). So it's a config inside a config. The Pod template has the containers: name, image, ports. The Deployment's selector.matchLabels must match the template's labels: that's how the Deployment knows which Pods belong to it.");
  annotated(s, "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-deployment\n  labels:\n    app: nginx\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: nginx          # ← must match ↓\n  template:               # the Pod blueprint\n    metadata:\n      labels:\n        app: nginx        # ← Pod label\n    spec:\n      containers:\n        - name: nginx\n          image: nginx:1.27\n          ports:\n            - containerPort: 8080", [["replicas", "how many Pods from this template"], ["selector", "which Pods this Deployment owns, by label"], ["template", "a Pod config nested inside: its own metadata + spec"], ["labels", "key/value tags; the glue between everything"], ["containers", "image, ports, env, resources"]], 4.6, 9);

  s = slide("CONTENT", "Service: connected by labels, ports chained", "Service selector app: nginx matches the Pod labels, so the Service forwards to those Pods. Ports: port = the Service's own port (what others call); targetPort = the container's containerPort. Chain: request → Service:80 → Pod:8080. Verify: kubectl describe service shows Endpoints = Pod IPs; kubectl get pod -o wide shows the same IPs.");
  annotated(s, "apiVersion: v1\nkind: Service\nmetadata:\n  name: nginx-service\nspec:\n  selector:\n    app: nginx            # ← the Pod label\n  ports:\n    - protocol: TCP\n      port: 80            # Service port\n      targetPort: 8080    # = containerPort", [["selector", "forward to Pods carrying this label"], ["port", "the Service's port: what other Pods call"], ["targetPort", "the container's port: must equal containerPort"], ["Endpoints", "kubectl describe svc shows the Pod IPs it found"]], 4.6, 10);
  box(s, { x: 5.35, y: 3.9, w: 4.15, h: 1.1, t: "caller → nginx-service:80 → Pod 10.244.0.7:8080\n\nkubectl describe service nginx-service   # Endpoints: 10.244.0.7:8080, 10.244.0.8:8080", color: K.tint, size: 10, font: MONO });

  // ================= 7. DEMO PROJECT =================
  section = "Demo project"; pres.addSection({ title: section });
  s = slide("SECTION", "7 · Demo project: MongoDB and Mongo Express", "1:16:16. Four config files: mongo Deployment + internal Service, Secret, ConfigMap, mongo-express Deployment + external Service. Request flow: browser → external service → mongo-express Pod → internal service → mongo Pod. Secret and ConfigMap must be created BEFORE the Deployments that reference them.", "Two Deployments, two Services, a Secret and a ConfigMap");

  s = slide("CONTENT", "What we're building", "Draw the request flow and name every component so the YAML files map onto the picture. Order of creation matters: Secret and ConfigMap first.");
  box(s, { x: 0.5, y: 1.4, w: 1.4, h: 0.9, t: "Browser", color: TINT.grey, size: 11, bold: true });
  arrow(s, 1.9, 1.85, 2.4, 1.85, K.c);
  box(s, { x: 2.4, y: 1.4, w: 1.9, h: 0.9, t: "mongo-express-service\nexternal (NodePort 30000)", color: LIGHT, size: 10, bold: true });
  arrow(s, 4.3, 1.85, 4.8, 1.85, K.c);
  pod(s, 4.8, 1.4, "Pod\nmongo-express", 1.5, 0.9);
  arrow(s, 6.3, 1.85, 6.8, 1.85, K.c);
  box(s, { x: 6.8, y: 1.4, w: 1.3, h: 0.9, t: "mongodb-service\ninternal", color: LIGHT, size: 10, bold: true });
  arrow(s, 8.1, 1.85, 8.5, 1.85, K.c);
  pod(s, 8.5, 1.4, "Pod\nmongodb", 1.0, 0.9);
  box(s, { x: 2.4, y: 2.7, w: 2.0, h: 0.7, t: "ConfigMap\ndatabase_url", color: K.tint, size: 10, bold: true });
  box(s, { x: 4.6, y: 2.7, w: 2.0, h: 0.7, t: "Secret\nusername · password", color: TINT.bad, size: 10, bold: true });
  arrow(s, 3.4, 2.7, 5.3, 2.3, K.c); arrow(s, 5.6, 2.7, 5.6, 2.3, K.c); arrow(s, 6.6, 2.9, 9.0, 2.3, K.c);
  const files = [["1", "mongo-secret.yaml", "Secret: root username + password (base64)"], ["2", "mongo-configmap.yaml", "ConfigMap: database_url = mongodb-service"], ["3", "mongo.yaml", "Deployment mongodb + internal Service (ClusterIP :27017)"], ["4", "mongo-express.yaml", "Deployment mongo-express + external Service (NodePort :30000)"]];
  files.forEach(([n, f, d], i) => { box(s, { x: 0.5, y: 3.6 + i * 0.36, w: 0.35, h: 0.3, t: n, color: K.c, tc: C.background1, size: 10, bold: true }); text(s, f, { x: 0.95, y: 3.6 + i * 0.36, w: 2.2, h: 0.3, fontSize: 11, bold: true, fontFace: MONO, valign: "middle" }); text(s, d, { x: 3.2, y: 3.6 + i * 0.36, w: 6.3, h: 0.3, fontSize: 11, valign: "middle" }); });

  s = slide("CONTENT", "Step 1 · Secret, Step 2 · ConfigMap", "Secret values are base64: echo -n 'username' | base64. Type Opaque = arbitrary key/values. The ConfigMap holds the DB URL, which is simply the internal Service name: K8s DNS resolves it. Create both first: kubectl apply -f mongo-secret.yaml && kubectl apply -f mongo-configmap.yaml.");
  code(s, "# mongo-secret.yaml\napiVersion: v1\nkind: Secret\nmetadata:\n  name: mongodb-secret\ntype: Opaque\ndata:\n  # echo -n 'username' | base64\n  mongo-root-username: dXNlcm5hbWU=\n  # echo -n 'password' | base64\n  mongo-root-password: cGFzc3dvcmQ=", { x: 0.5, y: 1.15, w: 4.4, h: 2.4, fontSize: 9 });
  code(s, "# mongo-configmap.yaml\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: mongodb-configmap\ndata:\n  # = the internal Service name\n  database_url: mongodb-service", { x: 5.1, y: 1.15, w: 4.4, h: 2.4, fontSize: 9 });
  await card(s, { x: 0.5, y: 3.7, w: 4.4, h: 1.3, title: "Secret", body: "base64 is reversible: anyone with cluster access can decode it. Don't commit real values; create them from a secrets manager in CI.", ic: "FaKey", color: C.accent5, tint: TINT.bad, bodySize: 11 });
  await card(s, { x: 5.1, y: 3.7, w: 4.4, h: 1.3, title: "ConfigMap", body: "Plain config. The URL is just the Service name because K8s has internal DNS. Create both before the Deployments that reference them.", ic: "FaCog", bodySize: 11 });

  s = slide("CONTENT", "Step 3 · MongoDB Deployment + internal Service", "One file, two documents separated by ---. Env vars come from the Secret via valueFrom.secretKeyRef (so credentials never appear in the Deployment file). The Service has no type → ClusterIP (internal). Port 27017 all the way. Verify: kubectl get all, kubectl describe service mongodb-service → Endpoints = the Pod IP.");
  annotated(s, "apiVersion: apps/v1\nkind: Deployment\nmetadata: { name: mongodb-deployment, labels: { app: mongodb } }\nspec:\n  replicas: 1\n  selector: { matchLabels: { app: mongodb } }\n  template:\n    metadata: { labels: { app: mongodb } }\n    spec:\n      containers:\n        - name: mongodb\n          image: mongo:7\n          ports: [{ containerPort: 27017 }]\n          env:\n            - name: MONGO_INITDB_ROOT_USERNAME\n              valueFrom:\n                secretKeyRef: { name: mongodb-secret,\n                                key: mongo-root-username }\n            - name: MONGO_INITDB_ROOT_PASSWORD\n              valueFrom:\n                secretKeyRef: { name: mongodb-secret,\n                                key: mongo-root-password }\n---\napiVersion: v1\nkind: Service\nmetadata: { name: mongodb-service }\nspec:\n  selector: { app: mongodb }\n  ports: [{ port: 27017, targetPort: 27017 }]", [["valueFrom", "read the env value from a Secret key instead of writing it inline"], ["secretKeyRef", "name of the Secret + which key inside it"], ["---", "two objects in one file; applied together"], ["no type", "Service defaults to ClusterIP = internal only"], ["port chain", "Service :27017 → container :27017"]], 4.6, 7);

  s = slide("CONTENT", "Step 4 · Mongo Express Deployment + external Service", "Mongo Express needs: DB server address (from the ConfigMap via configMapKeyRef), admin user + password (from the Secret). Its Service is type NodePort with nodePort 30000 (allowed range 30000–32767) so the browser can reach it. minikube service mongo-express-service opens the URL. Flow is now complete.");
  annotated(s, "apiVersion: apps/v1\nkind: Deployment\nmetadata: { name: mongo-express, labels: { app: mongo-express } }\nspec:\n  replicas: 1\n  selector: { matchLabels: { app: mongo-express } }\n  template:\n    metadata: { labels: { app: mongo-express } }\n    spec:\n      containers:\n        - name: mongo-express\n          image: mongo-express\n          ports: [{ containerPort: 8081 }]\n          env:\n            - name: ME_CONFIG_MONGODB_ADMINUSERNAME\n              valueFrom: { secretKeyRef: { name: mongodb-secret,\n                           key: mongo-root-username } }\n            - name: ME_CONFIG_MONGODB_ADMINPASSWORD\n              valueFrom: { secretKeyRef: { name: mongodb-secret,\n                           key: mongo-root-password } }\n            - name: ME_CONFIG_MONGODB_SERVER\n              valueFrom: { configMapKeyRef: { name: mongodb-configmap,\n                           key: database_url } }\n---\napiVersion: v1\nkind: Service\nmetadata: { name: mongo-express-service }\nspec:\n  selector: { app: mongo-express }\n  type: NodePort\n  ports: [{ port: 8081, targetPort: 8081, nodePort: 30000 }]", [["configMapKeyRef", "same pattern as secretKeyRef, for the ConfigMap"], ["type: NodePort", "external: opens a port on every node"], ["nodePort", "30000–32767; what the browser hits"], ["minikube service", "minikube service mongo-express-service → opens the URL"]], 5.2, 7);

  s = slide("CONTENT", "Apply, verify, open", "Apply in order; watch Pods come up; describe the external service; minikube service opens the browser. Then create a database in Mongo Express and see it stored in MongoDB. Everything in the picture now exists.");
  code(s, "kubectl apply -f mongo-secret.yaml\nkubectl apply -f mongo-configmap.yaml\nkubectl apply -f mongo.yaml\nkubectl apply -f mongo-express.yaml\n\nkubectl get all                               # 2 deployments, 2 replicasets, 2 pods, 2 services\nkubectl get pod --watch                       # until both are Running 1/1\nkubectl logs <mongo-express-pod>              # 'Mongo Express server listening at http://0.0.0.0:8081'\nkubectl get service                           # mongo-express-service   NodePort   8081:30000/TCP\n\nminikube service mongo-express-service        # opens http://<minikube-ip>:30000 in your browser", { x: 0.5, y: 1.15, w: 9, h: 2.9, fontSize: 10 });
  keyline(s, "Browser → NodePort 30000 → mongo-express Pod → mongodb-service:27017 → mongodb Pod. Config from ConfigMap, credentials from Secret.");

  // ================= 8. NAMESPACES =================
  section = "Namespaces"; pres.addSection({ title: section });
  s = slide("SECTION", "8 · Organising components with namespaces", "1:46:16. A namespace = a virtual cluster inside the cluster. Default namespaces: default, kube-system, kube-public, kube-node-lease. Use cases: group resources, avoid conflicts between teams, share a cluster between staging/prod or blue/green, limit access and resources per team.", "Virtual clusters inside your cluster");

  s = slide("CONTENT", "What namespaces are and the ones you already have", "kubectl get namespace shows four: kube-system (system processes: master, kubectl; don't touch), kube-public (public cluster info, a ConfigMap), kube-node-lease (node heartbeats), default (where everything you create goes unless you say otherwise). Create with kubectl create namespace my-ns or a Namespace YAML.");
  await card(s, { x: 0.5, y: 1.2, w: 2.1, h: 2.3, title: "default", body: "Where your resources land if you don't specify. What we've used so far", ic: "FaFolder", bodySize: 11, titleSize: 14 });
  await card(s, { x: 2.97, y: 1.2, w: 2.1, h: 2.3, title: "kube-system", body: "System Pods: API server, scheduler, DNS. Don't create things here", ic: "FaCogs", bodySize: 11, titleSize: 14 });
  await card(s, { x: 5.43, y: 1.2, w: 2.1, h: 2.3, title: "kube-public", body: "Publicly readable cluster info (a ConfigMap). kubectl cluster-info", ic: "FaGlobe", bodySize: 11, titleSize: 14 });
  await card(s, { x: 7.9, y: 1.2, w: 1.6, h: 2.3, title: "kube-node-lease", body: "Node heartbeats: availability info", ic: "FaHeartbeat", bodySize: 10, titleSize: 11 });
  code(s, "kubectl get namespace\nkubectl create namespace my-namespace\nkubectl apply -f mongo-configmap.yaml --namespace=my-namespace     # or metadata.namespace in the file\nkubectl get configmap -n my-namespace", { x: 0.5, y: 3.7, w: 9, h: 1.3, fontSize: 10 });

  s = slide("CONTENT", "Why use namespaces", "Four reasons from the course. 1 Structure: one default namespace with 100 resources is chaos; group by type: database, monitoring, nginx-ingress, elastic. 2 Conflicts: two teams deploy 'my-app' with different configs → one overwrites the other; separate namespaces avoid it. 3 Sharing a cluster: staging + development, or blue + green versions, sharing the same nginx-ingress and monitoring. 4 Access and resources: a team gets rights and CPU/RAM quotas (ResourceQuota) only in its namespace.");
  const whyns = [["Structure", "Group related resources: database, monitoring, ingress, elastic. Easier overview", "FaSitemap"], ["No conflicts", "Team A and Team B both deploy 'my-app'. In one namespace the second overwrites the first", "FaUsers"], ["Share a cluster", "staging + dev, or blue + green, reuse the same ingress and monitoring", "FaCodeBranch"], ["Access & limits", "Per-namespace permissions (RBAC) and quotas: CPU, RAM, storage per team", "FaLock"]];
  for (let i = 0; i < 4; i++) await card(s, { x: 0.5 + (i % 2) * 4.6, y: 1.2 + Math.floor(i / 2) * 1.85, w: 4.4, h: 1.7, title: whyns[i][0], body: whyns[i][1], ic: whyns[i][2], bodySize: 12 });

  s = slide("CONTENT", "Namespace rules and a tool: kubens", "What you can't do: share most resources across namespaces (a ConfigMap in project-a can't be used by a Deployment in project-b; define it in each). What you can: a Service in another namespace is reachable by name.namespace: mysql-service.database. What's not namespaced at all: nodes, persistent volumes, namespaces themselves (kubectl api-resources --namespaced=false). Switching: kubectl --namespace everywhere is tedious; kubens (from kubectx) sets the active namespace.");
  await card(s, { x: 0.5, y: 1.2, w: 4.4, h: 2.1, title: "Inside a namespace", body: ["ConfigMaps and Secrets are per namespace: define them in each", "Services ARE reachable across: mysql-service.database", "Deployments, Pods, Services, ConfigMaps, Secrets, PVCs are namespaced"], ic: "FaFolder", bodySize: 11 });
  await card(s, { x: 5.1, y: 1.2, w: 4.4, h: 2.1, title: "Not namespaced (global)", body: ["Nodes", "Persistent Volumes", "Namespaces themselves", "kubectl api-resources --namespaced=false"], ic: "FaGlobe", bodySize: 11 });
  code(s, "# two ways to target a namespace\nkubectl apply -f config.yaml -n my-namespace       # flag\nmetadata:\n  namespace: my-namespace                          # in the file (preferred: explicit)\n\n# switch the active namespace instead of typing -n every time\nbrew install kubectx  →  kubens my-namespace       # 'kubens' alone lists them", { x: 0.5, y: 3.5, w: 9, h: 1.5, fontSize: 9.5 });

  // ================= 9. INGRESS =================
  section = "Ingress"; pres.addSection({ title: section });
  s = slide("SECTION", "9 · Ingress explained", "2:01:52. External Service = http://<ip>:<port>, fine for testing, not for a product. Ingress: a routing rule (host → service) + an Ingress Controller Pod that evaluates it. Entry point: in cloud a load balancer; bare metal a proxy server. Demo on minikube: enable the ingress addon, route a hostname to the Kubernetes dashboard.", "Real domains and HTTPS in front of your Services");

  s = slide("CONTENT", "External Service vs Ingress", "Left: NodePort opens ip:port on each node; users type http://124.89.101.2:35010. Right: Ingress sits in front; the Service becomes internal (ClusterIP); users type http://my-app.com. Ingress also terminates TLS and routes by path.");
  text(s, "External Service (what we did)", { x: 0.5, y: 1.15, w: 4.3, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
  box(s, { x: 0.5, y: 1.55, w: 1.5, h: 0.7, t: "Browser", color: TINT.grey, size: 11, bold: true });
  arrow(s, 2.0, 1.9, 2.5, 1.9, K.c);
  box(s, { x: 2.5, y: 1.55, w: 2.3, h: 0.7, t: "Service NodePort\nhttp://124.89.101.2:35010", color: LIGHT, size: 9.5, bold: true });
  bullets(s, ["IP and random port in the URL", "No domain, no HTTPS", "OK for testing only"], { x: 0.5, y: 2.4, w: 4.3, h: 1.2, fontSize: 12 });
  text(s, "Ingress", { x: 5.2, y: 1.15, w: 4.3, h: 0.3, fontSize: 13, bold: true, color: K.c });
  box(s, { x: 5.2, y: 1.55, w: 1.2, h: 0.7, t: "Browser", color: TINT.grey, size: 11, bold: true });
  arrow(s, 6.4, 1.9, 6.7, 1.9, K.c);
  box(s, { x: 6.7, y: 1.55, w: 1.3, h: 0.7, t: "Ingress\nmy-app.com", color: K.c, tc: C.background1, size: 10, bold: true });
  arrow(s, 8.0, 1.9, 8.3, 1.9, K.c);
  box(s, { x: 8.3, y: 1.55, w: 1.2, h: 0.7, t: "Service\nClusterIP", color: LIGHT, size: 10, bold: true });
  bullets(s, ["Real domain: http://my-app.com", "TLS termination (https)", "Routing by host and by path"], { x: 5.2, y: 2.4, w: 4.3, h: 1.2, fontSize: 12 });
  code(s, "apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata: { name: myapp-ingress }\nspec:\n  rules:\n    - host: myapp.com                    # must resolve to the ingress controller's IP\n      http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend: { service: { name: myapp-internal-service, port: { number: 8080 } } }   # a ClusterIP service", { x: 0.5, y: 3.55, w: 9, h: 1.5, fontSize: 7.5 });

  s = slide("CONTENT", "The Ingress Controller: who actually routes", "An Ingress object is only a rule. Something must read the rules and do the routing: the Ingress Controller, a Pod (nginx is the most common; K8s Nginx Ingress Controller, Traefik, HAProxy, cloud ones). It's the entry point to the cluster and evaluates all rules. In cloud: a cloud load balancer in front forwards to the controller. Bare metal: you provide an external proxy / LB. minikube: minikube addons enable ingress installs the nginx controller.");
  box(s, { x: 0.5, y: 1.4, w: 1.4, h: 0.9, t: "Browser", color: TINT.grey, size: 11, bold: true });
  arrow(s, 1.9, 1.85, 2.3, 1.85, K.c);
  box(s, { x: 2.3, y: 1.4, w: 1.8, h: 0.9, t: "Cloud LB /\nexternal proxy", color: C.text1, tc: C.background1, size: 10, bold: true });
  arrow(s, 4.1, 1.85, 4.5, 1.85, K.c);
  s.addShape(pres.ShapeType.roundRect, { x: 4.5, y: 1.1, w: 5.0, h: 2.3, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "cluster" });
  text(s, "cluster", { x: 4.6, y: 1.12, w: 2, h: 0.25, fontSize: 9, color: C.text2, bold: true });
  box(s, { x: 4.65, y: 1.4, w: 1.9, h: 0.9, t: "Ingress Controller\nPod (nginx)", color: K.c, tc: C.background1, size: 10, bold: true });
  arrow(s, 6.55, 1.85, 6.9, 1.85, K.c);
  box(s, { x: 6.9, y: 1.4, w: 1.1, h: 0.9, t: "Ingress\nrules", color: K.tint, size: 10, bold: true });
  arrow(s, 8.0, 1.85, 8.3, 1.85, K.c);
  box(s, { x: 8.3, y: 1.4, w: 1.1, h: 0.9, t: "Services\n→ Pods", color: LIGHT, size: 10, bold: true });
  text(s, "controller reads every Ingress rule and configures nginx accordingly", { x: 4.6, y: 2.4, w: 4.8, h: 0.5, fontSize: 9, color: C.text2, italic: true, align: "center" });
  await card(s, { x: 0.5, y: 3.6, w: 4.4, h: 1.4, title: "Popular controllers", body: "Kubernetes Nginx Ingress Controller (most common), Traefik, HAProxy, Istio gateway, cloud-native (AWS ALB, GKE).", ic: "FaRoute", bodySize: 11 });
  await card(s, { x: 5.1, y: 3.6, w: 4.4, h: 1.4, title: "On minikube", body: "minikube addons enable ingress  installs nginx in kube-system. Point a hostname at  minikube ip  in /etc/hosts.", ic: "FaLaptop", bodySize: 11 });

  s = slide("CONTENT", "Demo: Ingress for the dashboard", "minikube addons enable ingress → kubectl get pod -n ingress-nginx. The dashboard lives in kubernetes-dashboard namespace with a service on port 80. Write an Ingress in that namespace: host dashboard.com → kubernetes-dashboard:80. kubectl get ingress -n kubernetes-dashboard shows an ADDRESS after a moment; add '<address> dashboard.com' to /etc/hosts; open http://dashboard.com. Then: multiple paths, multiple subdomains, TLS via a Secret of type kubernetes.io/tls, default backend for unmatched requests.");
  code(s, "# ingress addon + dashboard\nminikube addons enable ingress\nminikube dashboard   # (installs the dashboard on newer versions)\nkubectl get svc -n kubernetes-dashboard\n\n# dashboard-ingress.yaml\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: dashboard-ingress\n  namespace: kubernetes-dashboard\nspec:\n  rules:\n    - host: dashboard.com\n      http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: kubernetes-dashboard\n                port: { number: 80 }\n\nkubectl apply -f dashboard-ingress.yaml\nkubectl get ingress -n kubernetes-dashboard     # ADDRESS 192.168.49.2\nsudo sh -c 'echo \"192.168.49.2 dashboard.com\" >> /etc/hosts'", { x: 0.5, y: 1.15, w: 5.0, h: 3.9, fontSize: 7.5 });
  await card(s, { x: 5.7, y: 1.15, w: 3.8, h: 1.85, title: "More routing", body: ["Several paths: /analytics, /shopping → different services", "Several hosts: analytics.myapp.com, shopping.myapp.com", "defaultBackend: where unmatched requests go (custom 404)"], ic: "FaSitemap", bodySize: 11 });
  await card(s, { x: 5.7, y: 3.2, w: 3.8, h: 1.85, title: "TLS", body: ["spec.tls: hosts + secretName", "Secret type kubernetes.io/tls with tls.crt and tls.key", "Same namespace as the Ingress", "cert-manager automates Let's Encrypt"], ic: "FaLock", bodySize: 11 });

  // ================= 10. HELM =================
  section = "Helm"; pres.addSection({ title: section });
  s = slide("SECTION", "10 · Helm: the package manager for Kubernetes", "2:24:17. Helm = package manager (like apt/npm for K8s) + templating engine + release manager. Chart = bundle of YAML files. Helm Hub / Artifact Hub for public charts. Helm 3 removed Tiller (the server-side component with too much power).", "Charts, templates, releases");

  s = slide("CONTENT", "Problem: the same 7 YAML files, over and over", "Deploy Elasticsearch: StatefulSet, ConfigMap, Secret, K8s user with permissions, Services… Someone has already written those. A Helm chart packages them so you can helm install. Also: your own microservices differ only in name, image, version → one template, many values.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 3.6, title: "Package manager", body: ["A chart = bundle of YAML files for one app", "Artifact Hub: thousands of public charts", "helm search hub elasticsearch", "helm install my-es elastic/elasticsearch", "Also private company chart repos"], ic: "FaBoxOpen" });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 3.6, title: "Templating engine", body: ["Your microservices: same YAML, different values", "Template with placeholders: {{ .Values.name }}", "values.yaml fills them in", "One chart → dev, staging, prod with different values files"], ic: "FaFileCode" });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 3.6, title: "Release manager", body: ["helm install = a release", "helm upgrade: change values or chart version", "helm rollback: back to a previous release", "Helm 3: no Tiller; history stored in the cluster as Secrets"], ic: "FaHistory" });

  s = slide("CONTENT", "Anatomy of a chart", "Chart.yaml: metadata (name, version, dependencies). values.yaml: default values for the templates. charts/: dependency charts. templates/: the YAML files with Go-template placeholders. Override values: helm install --values my-values.yaml, or --set key=value. Values are merged: defaults + your file + --set.");
  code(s, "mychart/\n├── Chart.yaml        # name, version, description, dependencies\n├── values.yaml       # default values\n├── charts/           # dependency charts\n└── templates/        # the YAML, with placeholders\n    ├── deployment.yaml\n    └── service.yaml\n\n# templates/deployment.yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: {{ .Values.name }}\nspec:\n  replicas: {{ .Values.replicas }}\n  template:\n    spec:\n      containers:\n        - name: {{ .Values.name }}\n          image: {{ .Values.image }}:{{ .Values.tag }}", { x: 0.5, y: 1.15, w: 5.2, h: 3.9, fontSize: 8.5 });
  code(s, "# values.yaml (defaults)\nname: my-app\nreplicas: 1\nimage: my-app\ntag: 1.0\n\n# my-values.yaml (override for prod)\nreplicas: 3\ntag: 1.4", { x: 5.9, y: 1.15, w: 3.6, h: 1.9, fontSize: 9 });
  code(s, "helm install my-release ./mychart \\\n  --values my-values.yaml\nhelm install my-release ./mychart \\\n  --set replicas=3\nhelm upgrade my-release ./mychart\nhelm rollback my-release 1\nhelm list", { x: 5.9, y: 3.2, w: 3.6, h: 1.85, fontSize: 9 });

  // ================= 11. VOLUMES =================
  section = "Volumes"; pres.addSection({ title: section });
  s = slide("SECTION", "11 · Persisting data with volumes", "2:38:07. Requirements: storage that doesn't depend on the Pod lifecycle, is available on ALL nodes (Pod may be rescheduled anywhere), survives cluster crashes. K8s doesn't give you that: you provide it. Three components: PersistentVolume, PersistentVolumeClaim, StorageClass.", "PersistentVolume · PersistentVolumeClaim · StorageClass");

  s = slide("CONTENT", "Three requirements, and why K8s makes you do it", "1 Storage must not depend on the Pod lifecycle. 2 Available on all nodes, because you don't know where the Pod will be scheduled. 3 Survives if the whole cluster crashes. Kubernetes gives you the abstraction (PV) but you plug in the actual storage: local disk, NFS, cloud disk (EBS, GCE PD), Ceph, Glusterfs… Think of PVs as an external plugin to the cluster.");
  const req = [["Independent of Pods", "Pod restarts, moves, dies. Data stays", "FaCube"], ["Available on all nodes", "The Pod may be scheduled anywhere; the data must follow", "FaServer"], ["Survives cluster crash", "Backups, remote storage, not just a node's disk", "FaShieldAlt"]];
  for (let i = 0; i < 3; i++) await card(s, { x: 0.5 + i * 3.07, y: 1.2, w: 2.85, h: 1.8, title: req[i][0], body: req[i][1], ic: req[i][2], bodySize: 11, titleSize: 14 });
  box(s, { x: 0.5, y: 3.2, w: 9, h: 0.6, t: "Kubernetes does not manage data persistence. You (the admin) provide and configure the storage.", color: C.accent5, tc: C.background1, size: 13, bold: true });
  bullets(s, ["Local: hostPath, local — tied to one node, no crash survival (OK for minikube / tests)", "Remote: NFS, cloud disks (AWS EBS, GCE PD, Azure Disk), Ceph, Glusterfs — the real thing", "Every type is a plugin: K8s calls the storage, the storage keeps the bytes"], { x: 0.5, y: 3.95, w: 9, h: 1.1, fontSize: 12 });

  s = slide("CONTENT", "PersistentVolume and PersistentVolumeClaim", "PV: a cluster resource (not namespaced) that represents a piece of storage: capacity, access mode, and the backend (nfs, gcePersistentDisk, hostPath). Created by the ADMIN. PVC: a request for storage by a USER/app: 'I need 10Gi, ReadWriteOnce'. K8s binds the claim to a matching PV. The Pod references the claim in volumes:, and the container mounts it with volumeMounts: at a path. Separation of concerns: users don't care where storage comes from.");
  code(s, "# PersistentVolume (admin)\napiVersion: v1\nkind: PersistentVolume\nmetadata:\n  name: pv-name\nspec:\n  capacity:\n    storage: 5Gi\n  accessModes:\n    - ReadWriteOnce\n  nfs:                      # or a cloud disk\n    path: /dir/path\n    server: nfs-server-ip", { x: 0.5, y: 1.15, w: 3.0, h: 2.9, fontSize: 7.5 });
  code(s, "# PersistentVolumeClaim (user)\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: pvc-name\nspec:\n  accessModes:\n    - ReadWriteOnce\n  resources:\n    requests:\n      storage: 10Gi\n  storageClassName: manual", { x: 3.65, y: 1.15, w: 2.85, h: 2.9, fontSize: 7.5 });
  code(s, "# Pod uses the claim\nspec:\n  containers:\n    - name: myapp\n      image: myapp\n      volumeMounts:\n        - name: data\n          mountPath: /var/www\n  volumes:\n    - name: data\n      persistentVolumeClaim:\n        claimName: pvc-name", { x: 6.65, y: 1.15, w: 2.85, h: 2.9, fontSize: 7.5 });
  arrow(s, 3.5, 2.6, 3.65, 2.6, K.c); arrow(s, 6.5, 2.6, 6.65, 2.6, K.c);
  text(s, "admin provisions", { x: 0.5, y: 4.1, w: 3.0, h: 0.3, fontSize: 10, color: C.text2, align: "center", italic: true });
  text(s, "user claims; K8s binds to a matching PV", { x: 3.65, y: 4.1, w: 2.85, h: 0.3, fontSize: 10, color: C.text2, align: "center", italic: true });
  text(s, "Pod mounts the claim at a path", { x: 6.65, y: 4.1, w: 2.85, h: 0.3, fontSize: 10, color: C.text2, align: "center", italic: true });
  keyline(s, "PV = the storage (global, admin). PVC = the request (namespaced, user). Pod → PVC → PV → real disk.");

  s = slide("CONTENT", "StorageClass, ConfigMap and Secret as volumes", "Creating PVs by hand for every claim doesn't scale with hundreds of apps. StorageClass provisions PVs DYNAMICALLY: it names a provisioner (kubernetes.io/aws-ebs, gce-pd…) with parameters; a PVC references storageClassName and K8s creates the PV on demand. Also: ConfigMap and Secret can be mounted as volumes (files), not just env vars; they're local volume types managed by K8s, good for config files and certificates.");
  code(s, "# StorageClass (admin, once)\napiVersion: storage.k8s.io/v1\nkind: StorageClass\nmetadata:\n  name: storage-class-name\nprovisioner: kubernetes.io/aws-ebs\nparameters:\n  type: io1\n  iopsPerGB: \"10\"\n\n# PVC just names the class\nspec:\n  storageClassName: storage-class-name\n  resources: { requests: { storage: 10Gi } }\n# → K8s creates the PV on demand", { x: 0.5, y: 1.15, w: 4.4, h: 3.0, fontSize: 8.5 });
  code(s, "# ConfigMap / Secret mounted as files\nspec:\n  containers:\n    - name: app\n      volumeMounts:\n        - name: config\n          mountPath: /etc/app\n        - name: certs\n          mountPath: /etc/certs\n  volumes:\n    - name: config\n      configMap: { name: app-config }\n    - name: certs\n      secret: { secretName: app-tls }", { x: 5.1, y: 1.15, w: 4.4, h: 3.0, fontSize: 8.5 });
  await card(s, { x: 0.5, y: 4.3, w: 4.4, h: 0.7, title: "StorageClass = dynamic PV provisioning", body: "", ic: "FaMagic", titleSize: 13 });
  await card(s, { x: 5.1, y: 4.3, w: 4.4, h: 0.7, title: "ConfigMap / Secret = files inside the container", body: "", ic: "FaFileAlt", titleSize: 13 });

  // ================= 12. STATEFULSET =================
  section = "StatefulSet"; pres.addSection({ title: section });
  s = slide("SECTION", "12 · Deploying stateful apps with StatefulSet", "2:58:38. Stateful = keeps data between sessions (databases, queues). Deployment replicas are identical and interchangeable; DB replicas are not: only one may write (master), others read (slaves) and sync. StatefulSet gives: sticky identity, ordered creation/deletion, per-Pod storage, per-Pod DNS name.", "Databases and other apps that must remember");

  s = slide("CONTENT", "Why a Deployment isn't enough for a database", "Replicated DB Pods can't be identical: if all could write to the same storage you'd get inconsistency. So: one master writes, workers read; workers sync from master; new worker clones from the previous one; each Pod has its own storage with continuous synchronisation. A Deployment can't express 'this one is master' or 'start them in order'.");
  text(s, "Deployment (stateless)", { x: 0.5, y: 1.15, w: 4.3, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
  for (let i = 0; i < 3; i++) box(s, { x: 0.5 + i * 1.45, y: 1.55, w: 1.3, h: 0.7, t: "app-7f9c" + ["x", "y", "z"][i], color: LIGHT, size: 10, bold: true });
  bullets(s, ["Identical, interchangeable, random names", "Any replica serves any request", "Created and deleted in any order", "Share nothing (or share one volume)"], { x: 0.5, y: 2.4, w: 4.3, h: 1.4, fontSize: 12 });
  text(s, "StatefulSet (stateful)", { x: 5.2, y: 1.15, w: 4.3, h: 0.3, fontSize: 13, bold: true, color: K.c });
  [["mysql-0\nMASTER", K.c, C.background1], ["mysql-1\nworker", LIGHT, C.text1], ["mysql-2\nworker", LIGHT, C.text1]].forEach(([t, c, tc], i) => { box(s, { x: 5.2 + i * 1.45, y: 1.55, w: 1.3, h: 0.7, t, color: c, tc, size: 10, bold: true }); box(s, { x: 5.2 + i * 1.45, y: 2.3, w: 1.3, h: 0.4, t: "PV " + i, color: K.tint, size: 9, bold: true }); });
  arrow(s, 6.5, 1.75, 6.65, 1.75, K.c); arrow(s, 7.95, 1.75, 8.1, 1.75, K.c);
  bullets(s, ["Sticky identity: name = <set>-<ordinal>", "Only master writes; workers read and sync", "Created 0 → 1 → 2, deleted in reverse", "Each Pod has its own persistent volume"], { x: 5.2, y: 2.85, w: 4.3, h: 1.4, fontSize: 12 });
  keyline(s, "A StatefulSet keeps the roles and the order. The replication itself is still the database's job, not Kubernetes'.");

  s = slide("CONTENT", "What StatefulSet guarantees", "1 Sticky identity: Pods named $(statefulset)-$(ordinal): mysql-0, mysql-1; a replaced Pod keeps its name and reattaches its PV. 2 Ordered: next Pod only created when the previous is Running; deletion in reverse order. 3 Storage: each Pod gets its own PVC via volumeClaimTemplates; must be remote storage so a rescheduled Pod on another node finds its data. 4 Stable DNS: each Pod has $(name).$(service).$(namespace).svc.cluster.local via a headless Service (clusterIP: None), so the app can address the master directly. You configure the DB clustering yourself; it's complex, which is why many run DBs outside K8s.");
  const g = [["Sticky identity", "mysql-0, mysql-1, mysql-2. A replacement keeps the name and its own volume", "FaIdBadge"], ["Ordered start / stop", "0 then 1 then 2. Scale down removes the highest first. Master is never left behind", "FaSortNumericDown"], ["Own storage per Pod", "volumeClaimTemplates creates a PVC per Pod. Needs remote storage to survive rescheduling", "FaDatabase"], ["Stable DNS per Pod", "mysql-0.mysql-svc.default.svc.cluster.local via a headless Service (clusterIP: None)", "FaNetworkWired"]];
  for (let i = 0; i < 4; i++) await card(s, { x: 0.5 + (i % 2) * 4.6, y: 1.2 + Math.floor(i / 2) * 1.6, w: 4.4, h: 1.5, title: g[i][0], body: g[i][1], ic: g[i][2], bodySize: 11 });
  keyline(s, "Verdict from the course: stateful apps are harder on K8s. Many teams host databases outside the cluster.", C.text1);

  // ================= 13. SERVICES =================
  section = "Services"; pres.addSection({ title: section });
  s = slide("SECTION", "13 · Kubernetes Services explained", "3:13:43. Why Services: Pods are ephemeral, IPs change; a Service gives a stable IP + DNS and load balancing. Four types: ClusterIP (default), Headless, NodePort, LoadBalancer. Plus multi-port services.", "ClusterIP · Headless · NodePort · LoadBalancer");

  s = slide("CONTENT", "ClusterIP: the default, internal service", "Flow: browser → Ingress → Service (ClusterIP 10.104.x.x : 3200) → Pods on any node. Service selector matches Pod labels; targetPort matches containerPort. Service knows its Pods via Endpoints (kubectl get endpoints: updated whenever Pods change). Service port is arbitrary; targetPort must be the container's. Multi-container Pods (app + log collector sidecar): same Pod IP, different ports.");
  box(s, { x: 0.5, y: 1.35, w: 1.3, h: 0.7, t: "Ingress", color: K.c, tc: C.background1, size: 11, bold: true });
  arrow(s, 1.8, 1.7, 2.3, 1.7, K.c);
  box(s, { x: 2.3, y: 1.35, w: 2.3, h: 0.7, t: "Service microservice-one\nClusterIP 10.104.5.9 : 3200", color: LIGHT, size: 10, bold: true });
  arrow(s, 4.6, 1.5, 5.2, 1.3, K.c); arrow(s, 4.6, 1.9, 5.2, 2.2, K.c);
  s.addShape(pres.ShapeType.roundRect, { x: 5.2, y: 1.05, w: 2.0, h: 0.95, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "node1" }); text(s, "node 1", { x: 5.25, y: 1.07, w: 1, h: 0.2, fontSize: 8, color: C.text2 });
  pod(s, 5.3, 1.3, "Pod 10.2.1.5 :3000", 1.8, 0.55);
  s.addShape(pres.ShapeType.roundRect, { x: 5.2, y: 2.1, w: 2.0, h: 0.95, rectRadius: 0.1, fill: { color: TINT.grey }, line: { color: TINT.grey }, objectName: "node2" }); text(s, "node 2", { x: 5.25, y: 2.12, w: 1, h: 0.2, fontSize: 8, color: C.text2 });
  pod(s, 5.3, 2.35, "Pod 10.2.2.3 :3000", 1.8, 0.55);
  text(s, "port 3200 → targetPort 3000", { x: 2.3, y: 2.1, w: 2.3, h: 0.3, fontSize: 9, color: C.text2, align: "center", italic: true });
  await card(s, { x: 7.4, y: 1.05, w: 2.1, h: 2.0, title: "Endpoints", body: "kubectl get endpoints: the live list of Pod IP:port behind a Service. Updated as Pods come and go", ic: "FaList", bodySize: 10, titleSize: 13 });
  code(s, "apiVersion: v1\nkind: Service\nmetadata:\n  name: microservice-one-service\nspec:\n  selector:\n    app: microservice-one        # Pod labels\n  ports:\n    - protocol: TCP\n      port: 3200                 # Service port (your choice)\n      targetPort: 3000           # containerPort (not your choice)", { x: 0.5, y: 3.3, w: 5.4, h: 1.75, fontSize: 8.5 });
  await card(s, { x: 6.1, y: 3.3, w: 3.4, h: 1.75, title: "Multi-port", body: "One Service, several ports (e.g. 27017 for mongo, 9216 for its metrics exporter sidecar). Each port must then have a name.", ic: "FaEllipsisH", bodySize: 10.5, titleSize: 13 });

  s = slide("CONTENT", "Headless service: talk to a specific Pod", "Sometimes a client needs ONE specific Pod, not a random one: stateful apps where only the master accepts writes, or workers that must sync from the master. A headless Service has clusterIP: None: no Service IP; a DNS lookup of the service returns the Pod IPs directly. Used alongside a normal ClusterIP service for a StatefulSet. Pod DNS: mysql-0.mysql-headless.");
  box(s, { x: 0.5, y: 1.4, w: 1.6, h: 0.8, t: "client Pod", color: TINT.grey, size: 11, bold: true });
  arrow(s, 2.1, 1.8, 2.6, 1.8, K.c);
  box(s, { x: 2.6, y: 1.4, w: 2.2, h: 0.8, t: "DNS lookup\nmysql-headless", color: K.tint, size: 10, bold: true });
  arrow(s, 4.8, 1.8, 5.3, 1.8, K.c);
  box(s, { x: 5.3, y: 1.4, w: 1.6, h: 0.8, t: "returns Pod IPs\n(no Service IP)", color: K.c, tc: C.background1, size: 10, bold: true });
  arrow(s, 6.9, 1.6, 7.5, 1.4, K.c); arrow(s, 6.9, 2.0, 7.5, 2.2, K.c);
  pod(s, 7.5, 1.15, "mysql-0 (master)", 2.0, 0.5); pod(s, 7.5, 1.95, "mysql-1 (worker)", 2.0, 0.5);
  code(s, "apiVersion: v1\nkind: Service\nmetadata:\n  name: mysql-headless\nspec:\n  clusterIP: None          # ← headless\n  selector:\n    app: mysql\n  ports:\n    - port: 3306\n      targetPort: 3306", { x: 0.5, y: 2.5, w: 4.4, h: 2.5, fontSize: 9.5 });
  await card(s, { x: 5.1, y: 2.5, w: 4.4, h: 2.5, title: "When you need it", body: ["StatefulSets: write to mysql-0 only, read from any", "Workers that must find the master to sync", "Any time a client must choose the Pod", "Usually deployed next to a normal ClusterIP service"], ic: "FaCrosshairs", bodySize: 11 });

  s = slide("CONTENT", "NodePort and LoadBalancer: external access", "NodePort: opens a static port (30000–32767) on EVERY node; external traffic hits node-ip:nodePort; it also creates a ClusterIP internally. Not secure: nodes exposed directly. LoadBalancer: asks the cloud provider for an external load balancer that forwards to NodePort → ClusterIP → Pods. In practice: LoadBalancer or Ingress in production; NodePort for quick tests.");
  const types = [["ClusterIP", "internal only", "Default. Reachable inside the cluster by name / IP", "FaLock"], ["NodePort", "node-ip:30000–32767", "Opens the port on every node. Testing only; exposes nodes", "FaDoorOpen"], ["LoadBalancer", "cloud LB IP", "Cloud provisions a load balancer → NodePort → ClusterIP → Pods", "FaCloud"], ["Headless", "no IP", "DNS returns Pod IPs. For StatefulSets", "FaCrosshairs"]];
  for (let i = 0; i < 4; i++) {
    const y = 1.2 + i * 0.78;
    await card(s, { x: 0.5, y, w: 9, h: 0.7, title: types[i][0], body: "", ic: types[i][3], titleSize: 13 });
    box(s, { x: 2.9, y: y + 0.15, w: 1.9, h: 0.4, t: types[i][1], color: K.tint, size: 10, bold: true, font: MONO });
    text(s, types[i][2], { x: 5.0, y, w: 4.4, h: 0.7, fontSize: 11, valign: "middle" });
  }
  code(s, "spec:\n  type: LoadBalancer                                              # or NodePort\n  ports: [{ port: 3200, targetPort: 3000, nodePort: 30010 }]    # nodePort: only for NodePort / LoadBalancer", { x: 0.5, y: 4.35, w: 9, h: 0.7, fontSize: 8 });

  // ================= WRAP =================
  section = "Wrap-up"; topic = Object.assign({}, NEUTRAL, { name: "Wrap-up" }); pres.addSection({ title: section });
  s = slide("CONTENT", "Wrap up: the whole picture", "Recap. The flow from browser to disk, and the five mental models that make all of it coherent.");
  const flow = [["Ingress", "FaRoute"], ["Service", "FaNetworkWired"], ["Deployment /\nStatefulSet", "FaLayerGroup"], ["Pods", "FaCube"], ["ConfigMap\n+ Secret", "FaCog"], ["PVC → PV\n→ storage", "FaDatabase"]];
  for (let i = 0; i < flow.length; i++) {
    const x = 0.5 + i * 1.52;
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.3, y: 1.25, w: 0.75, h: 0.75, fill: { color: K.c }, line: { color: K.c }, objectName: "flow circle " + i });
    s.addImage({ data: await icon(flow[i][1], "FFFFFF"), x: x + 0.475, y: 1.425, w: 0.4, h: 0.4, objectName: "flow icon " + i });
    text(s, flow[i][0], { x, y: 2.1, w: 1.35, h: 0.6, fontSize: 11, bold: true, align: "center" });
    if (i < flow.length - 1) arrow(s, x + 1.1, 1.62, x + 1.47, 1.62);
  }
  const items = [["You declare desired state in YAML; K8s reconciles forever", "FaSyncAlt"], ["Pods are mortal; Services give them a stable address", "FaNetworkWired"], ["Labels and selectors connect everything", "FaTag"], ["Config and secrets live outside the image", "FaCog"], ["Storage is yours to provide: PV, PVC, StorageClass", "FaDatabase"], ["Namespaces organise; Ingress exposes; Helm packages", "FaBoxOpen"]];
  for (let i = 0; i < items.length; i++) {
    const x = 0.5 + (i % 2) * 4.6, y = 2.85 + Math.floor(i / 2) * 0.72;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 4.4, h: 0.62, rectRadius: 0.1, fill: { color: K.tint }, line: { color: K.tint }, objectName: "recap " + i });
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.12, y: y + 0.11, w: 0.4, h: 0.4, fill: { color: K.c }, line: { color: K.c }, objectName: "recap circle " + i });
    s.addImage({ data: await icon(items[i][1], "FFFFFF"), x: x + 0.2, y: y + 0.19, w: 0.24, h: 0.24, objectName: "recap icon " + i });
    text(s, items[i][0], { x: x + 0.65, y, w: 3.65, h: 0.62, fontSize: 11, bold: true, valign: "middle" });
  }

  s = slide("CONTENT", "Where to go next", "Suggested follow-ups.");
  await card(s, { x: 0.5, y: 1.2, w: 2.85, h: 3.6, title: "Run it for real", body: ["A managed cluster: EKS, GKE, AKS", "kubectl config contexts", "Resource requests / limits", "Liveness and readiness probes", "Horizontal Pod Autoscaler"], ic: "FaCloud", color: K.c, tint: K.tint });
  await card(s, { x: 3.57, y: 1.2, w: 2.85, h: 3.6, title: "Operate it", body: ["Prometheus + Grafana monitoring", "Centralised logging (Loki, ELK)", "RBAC: users, roles, service accounts", "Network policies", "cert-manager for TLS"], ic: "FaChartLine", color: K.c, tint: K.tint });
  await card(s, { x: 6.65, y: 1.2, w: 2.85, h: 3.6, title: "Automate it", body: ["CI builds images, pushes to a registry", "GitOps: ArgoCD / Flux apply your YAML", "Helm charts per environment", "Terraform for the cluster itself"], ic: "FaCogs", color: TOPIC.ci.c, tint: TOPIC.ci.tint });

  s = slide("TITLE", "Thanks. Questions?", "End.", "Reference: 'Kubernetes Tutorial for Beginners [FULL COURSE in 4 Hours]', TechWorld with Nana.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch(e => { console.error(e); process.exit(1); });
