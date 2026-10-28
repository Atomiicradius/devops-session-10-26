# Session plan — DevOps hands-on (2 h 40 m core · 2 h 30 m with cuts · 3 h stretch)

Audience: 3rd-year engineering students, mostly first contact with Docker / K8s. Two instructors: **A** presents first (Intro, Git, Docker), **B** second (Kubernetes, CI/CD). Whoever is not presenting floats the room and unblocks students.

Deck: `slides/devops-workshop.pptx` (43 slides, colour-coded: blue = Docker, violet = Kubernetes, amber = CI/CD, teal = hands-on). Speaker notes are on every slide. The full explainer is `EXPLAINER.md`.

## Before the session

Both:
- [ ] Repo is at github.com/PhalakshaCG/devops-session-10-26 (public). Put a QR code of it on slide 1.
- [ ] Each instructor creates a Codespace on the repo and runs all three labs end to end. Note timings.
- [ ] Day before: tell students to have a GitHub account and verify they can open github.com/codespaces (free tier is 120 core-hours/month, plenty).
- [ ] Projector check: terminal font ≥ 18 pt, light terminal theme.

Instructor B only:
- [ ] Run `jenkins/docker-compose.yml` on your laptop beforehand, finish the plugin wizard, add the NodeJS tool named `node20`, create a Pipeline job pointed at the repo with script path `jenkins/Jenkinsfile`, run it once. Do NOT do the wizard live (5+ min of waiting).
- [ ] Optional: keep your existing `exercise-3.md` Freestyle job as a second demo.

## Timeline (160 min core)

| Clock | Min | Block | Slides | Who | Mode |
|---|---|---|---|---|---|
| 0:00 | 5 | Welcome, repo URL, everyone starts creating a Codespace (it builds while we talk) | 1–3 | A | talk |
| 0:05 | 35 | Intro to DevOps + Git (your existing decks + git exercises 1–2) | your decks | A | talk + hands-on |
| 0:40 | 13 | Docker concepts, quick check, recap | 4–14 | A | talk |
| 0:53 | 30 | **Lab 1 · Docker** | 15 | A leads, B floats | hands-on |
| 1:23 | 7 | Break. Before leaving: `minikube start --driver=docker --cpus=2 --memory=3g` | — | — | — |
| 1:30 | 13 | Kubernetes concepts, quick check, recap | 16–29 | B | talk |
| 1:43 | 30 | **Lab 2 · Kubernetes on minikube** | 30 | B leads, A floats | hands-on |
| 2:13 | 9 | CI/CD + Jenkins concepts, quick check, recap | 31–39 | B | talk |
| 2:22 | 12 | **Lab 3 · GitHub Actions** (+ 3 min Jenkins demo from B's laptop) | 40 | B leads, A floats | hands-on |
| 2:34 | 6 | Big picture, what next, Q&A | 41–43 | A + B | talk |
| 2:40 | | End | | | |

Hands-on: 72 min of labs + the Git exercises ≈ 55 % of the session.

### To land exactly at 2:30 (cut in this order)
1. Skip the three "Quick check" slides (13, 28, 38): −6 min.
2. Jenkins demo → just show slide 36/37 and talk over it: −3 min.
3. Lab 2 steps 8–9 (debug, cleanup): mention verbally: −3 min.

### If you have the 3rd hour (add in this order)
1. Lab 2 challenge: deploy a non-existent tag, watch `ImagePullBackOff`, fix with `rollout undo` (slide 25 makes sense of it): +10 min.
2. Full Jenkins demo including your `exercise-3.md` Freestyle job, compare with the Jenkinsfile: +10 min.
3. Lab 1 + Lab 2 challenges as a race, prize for first green Actions badge: +10 min.

## Facilitation tips
- **Run every command on the projector in your own Codespace**, same order as the lab file. Students mirror you. Never type something not in the lab.
- Checkpoints: after each lab section ask for thumbs-up. Floater goes to thumbs-down people.
- `bash labs/check.sh` tells a student exactly which step they missed.
- The quick-check slides: ask, wait 10 seconds, let a student answer, then confirm. Answers are in the speaker notes.
- Common failures:
  - `docker: Cannot connect to the Docker daemon` → daemon still booting, wait 30 s.
  - `minikube start` stuck → `minikube delete && minikube start --driver=docker`.
  - Pod `ErrImagePull` → forgot `minikube image load`, or image tag typo.
  - Port popup didn't appear → PORTS tab in VS Code, click the globe icon.
  - Codespace is 2-core: don't scale beyond 4 replicas.
  - Actions tab empty on a fork → click "I understand my workflows, go ahead and enable them".
