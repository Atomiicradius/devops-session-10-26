#!/usr/bin/env bash
# Quick "where am I stuck?" checker for students.
ok(){ echo "✅ $1"; }; bad(){ echo "❌ $1"; }
command -v docker >/dev/null && docker info >/dev/null 2>&1 && ok "docker daemon running" || bad "docker not running (wait 30s and retry)"
docker image inspect hello-devops:v1 >/dev/null 2>&1 && ok "image hello-devops:v1 built" || bad "image hello-devops:v1 not built (Lab 1 step 3)"
minikube status >/dev/null 2>&1 && ok "minikube running" || bad "minikube not running: minikube start --driver=docker"
kubectl get deploy hello-devops >/dev/null 2>&1 && ok "deployment exists" || bad "deployment not applied (Lab 2 step 3)"
