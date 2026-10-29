# Chaos Day · a 3-hour DevOps hackathon

You've just joined the ops team of a campus canteen. Someone wrote **Crowd Meter**, a tiny web app that counts visitors (Node + Redis), then left. It "works on their laptop". Your job: make it run anywhere, make it survive, and make it ship itself. Then three incidents will hit it and you'll handle them like an on-call engineer.

Everything runs in your **GitHub Codespace** (the same setup as the workshop). Work alone or in pairs. Submit by the deadline even if you didn't finish every level: a half-done runbook with honest reasoning beats a perfect repo with no explanation.

## Rules
- Time box: 3 hours. Levels are ordered; do them in order. Each level is worth something on its own.
- Use the workshop labs, cheat sheet, docs, and search. **Don't** paste commands you can't explain: the runbook asks you to.
- Submit: a link to **your fork** containing `RUNBOOK.md` (use `hackathon/RUNBOOK_TEMPLATE.md`) and the output of `bash hackathon/verify.sh`.

## Setup (5 min)
```bash
cp -r hackathon/starter/* .        # app/ and k8s/ now live at the repo root
cd app && npm install && npm start   # it will crash or misbehave. That's the point. Read the error.
```

## Level 1 · Make it a container (30 min)
The app has **three deliberate problems** that only show up in containers or clusters. Find them (hints are in the `TODO(ops)` comments and in `test.js`). Fix them. Then:
- Write `app/Dockerfile` and build `crowd-meter:v1`.
- Run Redis as a container (`docker run -d --name redis redis:7`) and run your app container so it reaches Redis. Hint: `--network`, and the app must learn the Redis address from an environment variable.
- Prove it: screenshot of the page showing a visitor count that increases on refresh.

Questions your runbook must answer: *why does `localhost` not work inside a container? why does binding to `127.0.0.1` make the app unreachable?*

## Level 2 · One command to run it all (20 min)
Write `docker-compose.yml` with two services, `app` and `redis`. `docker compose up` must bring up a working page. Make the greeting and the version configurable through `environment:` without rebuilding.

## Level 3 · Put it on Kubernetes (45 min)
On minikube (`minikube start --driver=docker --cpus=2 --memory=3g`, `minikube image load crowd-meter:v1`), create in `k8s/`:
- `redis.yaml`: a Deployment and a ClusterIP Service named `redis`.
- `configmap.yaml`: holds the greeting and the Redis URL.
- `deployment.yaml`: `crowd-meter`, **2 replicas**, env from the ConfigMap, a **readinessProbe** on `/health`.
- `service.yaml`: NodePort Service `crowd-meter`.
Prove it: `curl $(minikube service crowd-meter --url)/health` in a loop shows different `host` values.

## Level 4 · Chaos Day (45 min)
Run each incident, **one at a time**, and handle it:
```bash
bash hackathon/chaos.sh 1
bash hackathon/chaos.sh 2
bash hackathon/chaos.sh 3
```
For each: capture the evidence (`kubectl get pod -w`, `describe`, `events`, `logs`), find the root cause, recover, and write it up. The point is not speed. The point is that your explanation is right. Incident 2 has a subtle answer about whether users were affected; look at `READY` columns before you decide.

## Level 5 · Make it ship itself (30 min)
Add `.github/workflows/ci.yml` that on every push: installs, runs `npm test`, builds the image. Push a commit that breaks `/health`, watch it go red, fix it, watch it go green. Link both runs in the runbook.

## Bonus (if you're done early, any order)
- Redis loses the count when its Pod restarts. Fix that with a PersistentVolumeClaim. Prove the count survives `kubectl delete pod`.
- Add a `/metrics` endpoint that reports the visit count as text, and a second Service port for it.
- Autoscale: `kubectl autoscale deploy crowd-meter --min=2 --max=5 --cpu-percent=50` (needs `minikube addons enable metrics-server`). Generate load and watch it scale.
- Replace NodePort with an Ingress on `crowd.local`.
- Build and push the image to GitHub Container Registry from the workflow, and make the Deployment pull it instead of `minikube image load`.

## What you hand in
1. Link to your fork. `RUNBOOK.md` at the root, filled in.
2. Output of `bash hackathon/verify.sh` pasted into the runbook.
3. Your Actions tab must show at least one red and one green run.

## How it's graded (100)
| Area | Points | What earns them |
|---|---|---|
| Level 1 · container | 15 | The three bugs found and explained correctly; image runs and reaches Redis |
| Level 2 · compose | 10 | Works with one command; config via environment |
| Level 3 · kubernetes | 25 | All four manifests correct; probe present; load-balancing proven |
| Level 4 · incidents | 25 | Correct root cause and recovery for each; evidence pasted; the "were users affected?" question answered with reasoning |
| Level 5 · CI | 10 | Red and green runs; test actually gates |
| Runbook quality | 15 | Clear, honest, in your own words; says what you'd change next |
| Bonus | up to +10 | Any bonus item working, with evidence |

Partial credit everywhere. An incident you couldn't fix but diagnosed correctly still scores.
