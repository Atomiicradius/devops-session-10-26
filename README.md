# DevOps Workshop — Docker, Kubernetes, CI/CD (hands-on)

A 2.5-hour beginner workshop for engineering students. Everything runs inside **GitHub Codespaces**, so nothing needs to be installed on your laptop.

## What's in here

| Path | What it is |
|---|---|
| `app/` | A tiny Node/Express web app (`/` and `/health`) + its `Dockerfile` |
| `k8s/` | Kubernetes `Deployment` and `Service` for the app |
| `.github/workflows/ci.yml` | GitHub Actions pipeline: install → test → build image |
| `jenkins/` | `Jenkinsfile` + `docker-compose.yml` to run Jenkins locally (instructor demo) |
| `labs/` | Step-by-step hands-on labs (start with `labs/00-setup.md`) |
| `SESSION_PLAN.md` | Minute-by-minute plan for instructors |
| `CHEATSHEET.md` | All commands on one page |
| `slides/` | `devops-workshop.pptx` (the 2.5 h session deck) and `docker-course.pptx` (a standalone 3 h Docker course deck following the TechWorld with Nana outline) |

## Quick start (students)

1. **Fork** this repo (top-right → Fork).
2. On your fork click **Code → Codespaces → Create codespace on main**. Wait ~2 min.
3. In the terminal that opens, run `docker --version && minikube version` — both should print versions.
4. Open `labs/00-setup.md` and follow along.

## Labs

| # | Lab | Time |
|---|---|---|
| 0 | [Setup: Codespace](labs/00-setup.md) | 5 min |
| 1 | [Docker: build and run a container](labs/01-docker.md) | 30 min |
| 2 | [Kubernetes: deploy on minikube](labs/02-kubernetes.md) | 30 min |
| 3 | [CI/CD: GitHub Actions + Jenkins](labs/03-cicd.md) | 15 min |

## Stuck?

- Run `bash labs/check.sh` to see what's working.
- Raise your hand 🙋 — that's what the second instructor is for.
