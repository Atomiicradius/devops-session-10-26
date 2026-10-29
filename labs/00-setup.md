# Lab 0 — Setup (5 min)

Goal: a working terminal with Docker, kubectl and minikube. No local installs.

1. Fork this repository to your own GitHub account. If you forked it earlier, click **Sync fork → Update branch** on your fork first, so you get the current `.devcontainer` config.
2. On **your fork**: **Code → Codespaces → Create codespace on main**.
   - The `.devcontainer/devcontainer.json` file tells Codespaces to install Docker-in-Docker, kubectl and minikube automatically.
3. When VS Code opens in the browser, open a terminal (`` Ctrl+` ``) and run:
   ```bash
   docker --version
   kubectl version --client
   minikube version
   ```
   All three should print a version. If `docker` fails, wait 30 s and retry — the daemon starts after the editor. If `minikube` or `kubectl` is *not found*, run `bash .devcontainer/setup.sh` (it installs what's missing, with retries).
4. Start minikube **now** so it's warm by the time we need it (takes 1–2 min, runs in the background while we do Docker):
   ```bash
   minikube start --driver=docker --cpus=2 --memory=3g
   ```
   Keep working in a second terminal while this runs.

✅ Done when: `docker --version` works and `minikube start` has been kicked off.
