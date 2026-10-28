# Lab 3 — CI/CD (15 min)

Goal: see a pipeline run automatically when you push code. Hands-on with **GitHub Actions** (zero setup); **Jenkins** is demoed by the instructor (same idea, self-hosted).

## Part A — GitHub Actions (students, 10 min)

### 1. Read the workflow (2 min)
Open `.github/workflows/ci.yml`:
- `on: push` → trigger
- `runs-on: ubuntu-latest` → GitHub gives you a fresh VM
- `steps` → checkout → setup node → npm install → npm test → docker build

That's the same thing you did by hand in Lab 1, written down so a robot does it every time.

### 2. Trigger it (3 min)
Make any change and push to your fork:
```bash
git checkout -b ci-test
echo "# CI test" >> README.md
git add . && git commit -m "ci: trigger pipeline"
git push -u origin ci-test
```
Go to your fork on GitHub → **Actions** tab. Watch the job run (~1 min). Green tick = good.

### 3. Break it on purpose (5 min)
In `app/index.js` change the health endpoint to return `{ status: "broken" }`. Commit, push.
Actions tab → red ❌. Click in → the **Run tests** step shows the assertion error.
Open a Pull Request from `ci-test` to `main` on your fork — notice the red check **on the PR**. This is how teams stop bad code before it merges.
Fix it, push again → green.

## Part B — Jenkins (instructor demo, 5–15 min)

Jenkins is the self-hosted, do-it-yourself version of the same idea. Instructor runs:
```bash
cd jenkins
docker compose up -d
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
Open http://localhost:8080, paste the password, install suggested plugins, then:
1. **New Item → Pipeline**, point it at this repo, script path `jenkins/Jenkinsfile`.
2. **Build Now** → stages Checkout → Install → Test → Build image light up.

Compare `jenkins/Jenkinsfile` with `.github/workflows/ci.yml` side by side. Same stages, different syntax, different host.

| | GitHub Actions | Jenkins |
|---|---|---|
| Hosting | GitHub runs it | You run it (server/VM/container) |
| Config | YAML in repo | Jenkinsfile (Groovy) in repo, or UI |
| Setup | none | install, plugins, agents |
| Best for | projects on GitHub | on-prem, custom infra, legacy |

✅ Done when: you have one green and one red run in the Actions tab of your fork.
