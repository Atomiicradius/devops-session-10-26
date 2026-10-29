#!/usr/bin/env bash
# Installs anything the universal image doesn't already have. Safe to re-run: bash .devcontainer/setup.sh
retry() { for i in 1 2 3 4 5; do "$@" && return 0; echo "  attempt $i failed, retrying in 5s"; sleep 5; done; return 1; }
if ! command -v kubectl >/dev/null; then
  echo "Installing kubectl"
  V=$(retry curl -fsSL https://dl.k8s.io/release/stable.txt)
  retry curl -fsSL -o /tmp/kubectl "https://dl.k8s.io/release/$V/bin/linux/amd64/kubectl" && sudo install /tmp/kubectl /usr/local/bin/kubectl
fi
if ! command -v minikube >/dev/null; then
  echo "Installing minikube"
  retry curl -fsSL -o /tmp/minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && sudo install /tmp/minikube /usr/local/bin/minikube
fi
echo; echo "== Tool check =="
docker --version && kubectl version --client && minikube version --short && node --version && echo "✅ all tools present"
