# Grader notes (instructors only)

## The three planted bugs (Level 1)
1. `app.listen(3000, "127.0.0.1")` → unreachable through `-p`. Fix: bind `0.0.0.0` (or omit the host). Expect: "inside a container, 127.0.0.1 is the container's own loopback; Docker's port mapping delivers to the container's external interface."
2. `redis://localhost:6379` hard-coded → fails in a container (localhost = the container). Fix: `process.env.REDIS_URL`, set via `-e`, compose `environment`, or ConfigMap. Expect: service-name DNS (`redis://redis:6379`).
3. No `/health` route → `npm test` fails and no readiness probe is possible. Fix: `app.get("/health", (req,res)=>res.json({status:"ok", host: os.hostname()}))`, independent of Redis so the test runs in CI without Redis. Bonus insight: a health check that pings Redis would make the Pod NotReady when Redis is down; discuss whether that's desired.

## Incident answers (Level 4)
1. **Pod killed**: ReplicaSet recreates within seconds; new name, new IP. Users unaffected if replicas ≥ 2 and the probe is in place, because the Service only routes to Ready Pods. Evidence: `kubectl get pod -w` showing Terminating + ContainerCreating, `kubectl get events`.
2. **Bad image tag**: new Pods go `ErrImagePull` → `ImagePullBackOff`. **Users were NOT affected**: RollingUpdate keeps old Pods until new ones are Ready, and they never become Ready. Rollout stalls safely. Recovery: `kubectl rollout undo deploy/crowd-meter` (or `set image` back). Full marks require noticing READY stayed 2/2 on old Pods. A student who says "it was an outage" without checking loses points; a student who says "it was an outage because I had replicas: 1 and maxUnavailable defaulted" and proves it gets full marks.
3. **Lunch rush**: `kubectl scale deploy crowd-meter --replicas=5`; curl loop shows 5 hosts. Greeting change: edit ConfigMap + restart Pods (`kubectl rollout restart deploy/crowd-meter`) because env vars from ConfigMaps are read at Pod start. Students who edit the ConfigMap and see no change, then figure out the restart, should be rewarded for the diagnosis. Zero-downtime expectation: the rollout restart is rolling.

## Common partial states and what to credit
- Deployment exists but Pods `CrashLoopBackOff` with "ECONNREFUSED 127.0.0.1:6379": bug 2 not fixed in K8s; credit Level 1 if it worked in Docker with `-e`.
- Probe present but Pods never Ready: `/health` missing or probe port wrong. Credit the YAML, not Level 3 proof.
- Only 1 replica during incident 2 → real outage. Correct reasoning about why it was an outage earns full Level 4 points for that incident.

## Timing guidance
Fast students finish Levels 1–5 in ~2 h and do bonus. Average: Levels 1–4 in 3 h, Level 5 partially. Tell everyone at 2:30 to stop building and write the runbook.

## Quick verification by the grader
Clone the fork into a Codespace, `bash hackathon/verify.sh` after `minikube start` + `kubectl apply -f k8s/`. Compare with the pasted output. Read the runbook's incident 2 answer first; it's the best single signal of understanding.
