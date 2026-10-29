# Runbook · Crowd Meter · <your name>

Repo: <link to your fork>   ·   Actions: <link to a green run>

## 1. What was wrong with the app I inherited
List every problem you found in `app/server.js` and why each one breaks in a container or cluster (not on a laptop).

## 2. How I run it
- Docker: `docker run ...` (what flags, and why each)
- Compose: what `docker compose up` starts and how the app finds Redis
- Kubernetes: which objects exist and what each one is for (one line each)

## 3. Incident log
For each incident: what I saw (paste the real `kubectl` output), what the root cause was, what I did, how long users were affected, and what I'd change so it can't happen again.

### Incident 1 · Pod killed
### Incident 2 · Bad release
### Incident 3 · Lunch rush + config change

## 4. The pipeline
What runs on every push, and one screenshot or link of a red run and a green run.

## 5. Self-check
Paste the full output of `bash hackathon/verify.sh`.

## 6. One thing I'd do next
If you had one more hour, what would you add and why? (persistence for Redis? HPA? ingress? secrets?)
