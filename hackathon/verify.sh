#!/usr/bin/env bash
# Self-check scorecard. Run from your repo root. Paste the output into your submission.
# It checks shape, not quality: the runbook and your explanations are graded by a human.
score=0; total=0
ok(){ echo "  ✅ $1"; score=$((score+1)); total=$((total+1)); }
bad(){ echo "  ❌ $1"; total=$((total+1)); }
D=crowd-meter
echo "Level 1 · Docker"
[ -f app/Dockerfile ] && ok "Dockerfile exists" || bad "app/Dockerfile missing"
docker image inspect $D:v1 >/dev/null 2>&1 && ok "image $D:v1 built" || bad "image $D:v1 not built"
grep -q "0.0.0.0\|app.listen(PORT\|app.listen(3000)" app/server.js 2>/dev/null && ok "app listens on all interfaces" || bad "app still bound to 127.0.0.1"
grep -q "REDIS_URL\|process.env" app/server.js 2>/dev/null && grep -q "redis://localhost" app/server.js 2>/dev/null && bad "Redis URL still hard-coded" || ok "Redis URL comes from config"
grep -q "/health" app/server.js 2>/dev/null && ok "/health route exists" || bad "/health route missing"
echo "Level 2 · Compose"
ls docker-compose.y*ml compose.y*ml >/dev/null 2>&1 && ok "compose file exists" || bad "no compose file"
echo "Level 3 · Kubernetes"
kubectl get deploy $D >/dev/null 2>&1 && ok "Deployment $D exists" || bad "Deployment $D not found"
R=$(kubectl get deploy $D -o jsonpath='{.spec.replicas}' 2>/dev/null); [ "${R:-0}" -ge 2 ] && ok "replicas >= 2 ($R)" || bad "replicas < 2"
kubectl get deploy $D -o yaml 2>/dev/null | grep -q readinessProbe && ok "readinessProbe configured" || bad "no readinessProbe"
kubectl get configmap -o name 2>/dev/null | grep -qi "$D\|greeting\|config" && ok "ConfigMap exists" || bad "no ConfigMap"
kubectl get deploy redis >/dev/null 2>&1 || kubectl get statefulset redis >/dev/null 2>&1 && ok "Redis runs in the cluster" || bad "no Redis Deployment/StatefulSet"
kubectl get svc $D >/dev/null 2>&1 && ok "Service $D exists" || bad "Service $D not found"
READY=$(kubectl get deploy $D -o jsonpath='{.status.readyReplicas}' 2>/dev/null); [ "${READY:-0}" -ge 1 ] && ok "at least one Pod Ready" || bad "no Ready Pods (describe + logs!)"
echo "Level 4 · Chaos survived"
H=$(kubectl rollout history deploy/$D 2>/dev/null | grep -c '^[0-9]'); [ "${H:-0}" -ge 2 ] && ok "rollout history has $H revisions" || bad "fewer than 2 rollout revisions"
IMG=$(kubectl get deploy $D -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null); echo "$IMG" | grep -q typo && bad "still running the broken image ($IMG)" || ok "running image $IMG"
echo "Level 5 · CI"
ls .github/workflows/*.y*ml >/dev/null 2>&1 && ok "GitHub Actions workflow exists" || bad "no workflow in .github/workflows"
[ -f RUNBOOK.md ] && ok "RUNBOOK.md exists" || bad "RUNBOOK.md missing"
echo; echo "Score: $score / $total   (shape only; the runbook is graded by hand)"
