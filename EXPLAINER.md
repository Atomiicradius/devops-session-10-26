# Explainer: the workshop deck, from fundamentals

Private reference for the instructors. One section per slide, in deck order. Each section gives (a) what the slide says, (b) the underlying fundamentals in more depth than the slide, (c) questions students are likely to ask, with answers. Skim the "Likely questions" if you only have 10 minutes.

Colour code used throughout the deck: **blue = Docker, violet = Kubernetes, amber = CI/CD, teal = hands-on, green = good/done, red = problem.** Every content slide carries a chip top-right so the audience always knows which topic they're in.

---

## Part 0 · Intro (slides 1–3)

### Slide 1 · Title
The repo URL (github.com/PhalakshaCG/devops-session-10-26) is on the slide; add a QR code of it. The point of showing it first: Codespaces take ~2 minutes to build, so get every student clicking **Code → Codespaces → Create codespace** while you do the intro.

### Slide 2 · The DevOps loop and the agenda
**What it says.** The infinity loop of DevOps: Plan → Code → Build → Test → Release → Deploy → Operate → Monitor. Git (already covered) lives in Plan/Code. Today covers Build, Test, Release, Deploy.

**Fundamentals.** DevOps is not a tool, it's the practice of shortening the loop from "developer writes code" to "users run it", and feeding what happens in production back into development. Each tool today maps to one part:
- Docker → *Build* (package the app into an image) and the first half of *Test* (run it identically anywhere).
- CI (GitHub Actions / Jenkins) → *Build + Test* automated on every change; CD → *Release + Deploy*.
- Kubernetes → *Deploy + Operate* (run many copies, heal, update).
Operate/Monitor (Prometheus, Grafana, logging) is out of scope but named on the last slides.

**Likely questions.**
- *Is DevOps a job title?* Both a culture and a role. "DevOps engineer" / "platform engineer" / "SRE" are real jobs; the skills are exactly today's.
- *Why is "Release" separate from "Deploy"?* Release = a versioned artefact (an image tagged v2) is ready. Deploy = that artefact is actually running for users. Continuous Delivery automates up to Release; Continuous Deployment automates Deploy too (slide 32).

### Slide 3 · How this session works
Sets the rhythm: ~10 min concepts, ~30 min lab, checkpoint. Tell students explicitly to **type commands rather than paste**: it slows them to the pace of understanding and the lab files are short. Mention the floater instructor. `labs/check.sh` is a tiny script that prints ✅/❌ for the four things that usually go wrong; it saves the floater from diagnosing from scratch.

---

## Part 1 · Docker (slides 4–15)

### Slide 4 · Section divider
Hook: "In the Git lab you all ran `npm install`. Did everyone get the same result?" Someone will have had a Node version problem. That's the whole motivation.

### Slide 5 · "But it works on my machine"
**What it says.** Three sources of environment drift: versions, missing pieces, OS differences. Fix: ship the environment with the code.

**Fundamentals.** An application is never just its source. It's source + runtime (Node 20) + dependencies (node_modules) + system libraries (libc, OpenSSL) + config (env vars) + OS assumptions (paths, line endings). Traditionally every machine assembled that stack by hand, and every hand did it slightly differently. A container image freezes the *entire* stack above the kernel into one artefact, so the only thing that varies between machines is the kernel, and Linux kernels are backwards compatible enough that this almost never matters.

**Likely questions.**
- *Isn't this what `package-lock.json` / virtualenv solve?* Partly. They pin language dependencies, not the runtime version or system libraries. Docker pins all of it.
- *What about the `.env` with the API key from the Git lab?* Secrets are deliberately NOT baked into images (anyone with the image could read them). They're injected at run time with `-e` or a secrets manager (slide 12 shows `-e`).

### Slide 6 · Virtual machines vs containers
**What it says.** VMs virtualise hardware: each one boots a whole guest OS on a hypervisor. Containers virtualise the OS: processes share the host kernel but are isolated.

**Fundamentals.** Three Linux kernel features make containers possible:
1. **Namespaces** give a process its own view of: process IDs (it sees itself as PID 1), network (own interfaces, own `localhost`), mount points (own root filesystem), hostname, users. That's why `hostname` inside the container prints the container ID, and why `ps aux` shows only the node process.
2. **cgroups** (control groups) limit and account CPU, memory, I/O for a group of processes. `docker run --memory=256m` is a cgroup.
3. **Union / overlay filesystems** stack read-only image layers plus one writable layer into what looks like a single filesystem (slide 9).
Docker didn't invent any of these; it packaged them with a great UX (Dockerfile, image format, registry) in 2013. "Container" is not a kernel object; it's a process started with all of the above applied.

Consequences worth saying out loud: a container starts in milliseconds because nothing boots, there is no init system, no SSH daemon, no cron. One process. If that process exits, the container is done.

**Likely questions.**
- *Can I run a Linux container on Mac/Windows?* Docker Desktop runs a small Linux VM and containers run inside it. In Codespaces you're on real Linux, so no VM.
- *Is a container secure like a VM?* Weaker isolation (shared kernel). Fine for trusted workloads; for hostile multi-tenant code people use gVisor, Kata or Firecracker micro-VMs. Not an exam topic today.
- *Which is "better"?* Different tools. VMs for isolation and non-Linux OSes; containers for packaging and density. Kubernetes nodes are usually VMs running containers.

### Slide 7 · Four words, one flow
**What it says.** Dockerfile → (`docker build`) → Image → (`docker run`) → Container; Image ⇄ (`docker push` / `pull`) ⇄ Registry.

**Fundamentals.**
- **Dockerfile**: a plain-text build script. Each line is an instruction.
- **Image**: an immutable, content-addressed stack of filesystem layers plus metadata (default command, env vars, exposed ports, working dir). Identified by a digest (`sha256:…`) and by human tags (`hello-devops:v1`). Analogy used on the slide: a class.
- **Container**: an image plus a writable layer plus a running process plus namespaces/cgroups. Analogy: an object (instance). Many containers from one image; they don't share writable state.
- **Registry**: an HTTP server that stores and serves images by name. Docker Hub (`docker.io`) is the default; GitHub Container Registry (`ghcr.io`), AWS ECR, Google Artifact Registry are others. A full image name is `registry/namespace/name:tag`, e.g. `docker.io/library/node:20-alpine`. If you omit the registry Docker assumes Docker Hub; if you omit the tag it assumes `latest`, which is just a tag like any other, not "newest".

**Likely questions.**
- *Where is my image stored after `docker build`?* In the local Docker engine's storage (`/var/lib/docker`). It is not in your project folder and not in git.
- *Why does the lab never `push`?* No registry account needed. minikube gets the image via `minikube image load` instead (slide 27). In real life CI pushes to a registry and the cluster pulls from it (slide 41).

### Slide 8 · The Dockerfile we'll use
Line-by-line fundamentals:
- `FROM node:20-alpine`: every image starts from a parent. `node:20-alpine` is the official Node image built on Alpine Linux (~50 MB vs ~1 GB for Debian-based). `20` is the Node major version. Alpine uses musl libc instead of glibc; a few native npm packages break on it. For a plain Express app it's fine.
- `WORKDIR /app`: sets the current directory for subsequent instructions and for the running container; creates the dir if missing.
- `COPY package.json ./` then `RUN npm install --omit=dev`: copies only the manifest and installs. Put *before* copying source so the expensive install layer is cached across code changes (slide 9). `--omit=dev` skips devDependencies.
- `COPY . .`: copy everything from the build context (the `.` you pass to `docker build`) into `/app`. `.dockerignore` excludes `node_modules` so we don't copy the host's (possibly wrong-architecture) modules.
- `EXPOSE 3000`: metadata only. It does not publish the port. `-p` at run time does. People get this wrong constantly.
- `CMD ["node", "index.js"]`: the default command. The JSON array form ("exec form") runs the process directly as PID 1 so it receives SIGTERM on `docker stop`. The string form (`CMD node index.js`) runs via `/bin/sh -c`, and the shell may swallow signals, making stops take 10 s. `docker run image <cmd>` overrides CMD (lab challenge).

Other instructions students may ask about: `ENV` (set env var in image), `ARG` (build-time variable), `ENTRYPOINT` (fixed executable; CMD becomes its args), `USER` (run as non-root; production should), `HEALTHCHECK`.

### Slide 9 · Images are layers, and layers are cached
**What it says.** Each instruction creates a read-only layer. Docker caches layers by instruction + input. A changed layer invalidates everything after it. Containers add a writable layer on top.

**Fundamentals.** The cache check for each instruction: same parent layer + same instruction text + (for COPY/ADD) same file content checksums ⇒ reuse. Once one instruction misses, all later ones rebuild. Hence the ordering rule: *least-changing first*. Base image → system packages → dependency manifest + install → source code.

Layers are shared between images on disk and over the network: ten images built `FROM node:20-alpine` store the base once. `docker history <image>` shows the layers and their sizes (lab challenge). The writable container layer is copy-on-write: reading comes from the image; writing copies the file up into the container's layer. `docker rm` deletes that layer, which is why "containers are disposable". Persistent data goes in **volumes** (`-v`), mentioned on the "where next" slide.

**Likely questions.**
- *Why did the second `docker build` take 1 second?* Everything cached. Point at the `CACHED` lines in the output.
- *If I edit index.js, how much is rebuilt?* `COPY . .` and `CMD` layers only. `npm install` is not re-run.
- *What is a multi-stage build?* Build in one image (with compilers, dev deps), copy only the output into a slim final image. Keeps production images small. Out of scope, named on slide 42.

### Slide 10 · What actually happens on `docker run`
**What it says.** Five steps: find/pull image → create container (layers + writable layer) → isolate (namespaces) → map ports → start CMD as PID 1. Plus a port-mapping diagram.

**Fundamentals.** `docker run` = `docker create` + `docker start`. The port mapping `-p HOST:CONTAINER` tells the engine to listen on the host interface at HOST and forward to the container's network namespace at CONTAINER. Memorise: *left is what you type in the browser, right is what the app listens on*. `-p 3001:3000` for a second copy works because each container has its own network namespace, so both can listen on "their" 3000 without conflict. The container only stops when PID 1 exits; `docker stop` sends SIGTERM, waits 10 s, then SIGKILL.

Flags you'll use: `-d` detach (run in background), `--name` so you don't have to use the random ID, `-e KEY=val` env var, `--rm` auto-delete on exit, `-it` interactive + TTY (for shells), `-v host:container` volume mount.

**Likely questions.**
- *Why can't I reach it on port 3000 in Codespaces without the popup?* The Codespace itself is a remote VM. VS Code forwards the VM's port 3000 to your browser. Two hops: browser → Codespace port → container port. The PORTS tab shows the forwarded ones.
- *What if two containers both want host port 3000?* Second one fails with "port is already allocated". Use a different host port.

### Slide 11 · Container lifecycle
**What it says.** Image → (run) → Created → Running → (stop) → Stopped → (rm) → Removed; `start` goes back from Stopped to Running.

**Fundamentals.** `docker ps` shows running; `docker ps -a` includes stopped. A stopped container keeps its writable layer, so `docker start` resumes with the same files (not the same process memory). `docker logs` reads the captured stdout/stderr of PID 1 from disk, which is why it works after the container stops. `docker exec` runs an *additional* process inside a running container's namespaces; it's how you get a shell without SSH. `exit` from that shell doesn't stop the container because PID 1 is still node.

**Likely questions.**
- *Where do the logs go?* Docker captures PID 1's stdout/stderr. Good practice: apps log to stdout, never to files inside the container.
- *Can I "save" a running container as an image?* `docker commit` exists, but it's an anti-pattern. Change the Dockerfile and rebuild, so the result is reproducible.

### Slide 12 · Docker commands you'll use in the lab
Reference table. Points to stress: `-t name:tag` on build; the `.` build context; `-p host:container`; `exec -it … sh` (Alpine has `sh`, not `bash`); `-e` for config; `stop` then `rm`. Also useful but not in the lab: `docker image prune`, `docker system df`, `docker inspect`, `docker cp`.

### Slide 13 · Quick check · Docker
Answers (also in notes):
1. **No.** Each container has its own writable layer; the image is shared read-only. Two containers writing to `/app/data.txt` write to two different files.
2. **No.** The `COPY . .` layer changed, but `RUN npm install` sits above it in the Dockerfile and its inputs (package.json) are unchanged, so it's served from cache.
3. **8080.** The left side of `-p` is the host port. The app still listens on 3000 inside.

### Slide 14 · Docker · 3 things to remember
The three sentences to repeat. If a student remembers only these, the lab will still make sense.

### Slide 15 · Lab 1
Lab steps are in `labs/01-docker.md`. Checkpoints: after `docker build` (thumbs up), after the browser shows the page, after `docker exec`. The "same image, v2 on 3001" step is the one that makes image-vs-container click for most people: two containers, one image, different env, no conflict.

---

## Part 2 · Kubernetes (slides 16–30)

### Slide 16 · Section divider
Hook for instructor B: "You just ran two containers by hand. Now imagine two hundred, on thirty servers, and one died at 3 am."

### Slide 17 · Docker runs one container. Who runs 200?
**What it says.** Four problems Docker alone doesn't solve: crashes, scaling across machines, zero-downtime updates, service discovery. Kubernetes is the orchestrator that answers them.

**Fundamentals.** Docker (the engine) manages containers on *one* host and does nothing when they die (unless you add `--restart`). Docker Compose manages a group on one host. Kubernetes manages containers across a *cluster* of hosts, continuously. It was open-sourced by Google in 2014, based on their internal Borg system; "K8s" = K + 8 letters + s. It is now the de facto standard: every cloud offers a managed version (EKS, GKE, AKS).

**Likely questions.**
- *Do I need Kubernetes for my college project?* No. One container on one VM is fine. You need it when you have many services, many copies, or uptime requirements. But understanding it is expected in DevOps interviews.
- *Alternatives?* Docker Swarm (simpler, fading), HashiCorp Nomad, cloud-specific (ECS, Cloud Run). The concepts transfer.

### Slide 18 · Cluster architecture
**What it says.** Control plane (API server, etcd, scheduler, controller manager) and worker nodes (kubelet, kube-proxy, container runtime, Pods).

**Fundamentals.**
- **kube-apiserver**: the only component anything talks to. `kubectl` is just an HTTP client for it. All state changes go through it; it validates and stores them in etcd.
- **etcd**: a distributed key-value store holding the entire cluster state (every object's YAML). Lose etcd, lose the cluster. Backed up religiously in production.
- **kube-scheduler**: watches for Pods with no node assigned and picks one based on resource requests, affinity rules, taints. It only *decides*; it doesn't run anything.
- **kube-controller-manager**: a bundle of control loops (Deployment controller, ReplicaSet controller, Node controller…). Each loop: watch desired state, observe actual state, act on the difference (slide 20).
- **kubelet**: the agent on every node. Watches the API server for Pods assigned to its node and tells the container runtime to run them; reports status back; runs probes.
- **container runtime**: what actually runs containers: containerd (most common now), CRI-O. Docker Engine was replaced as the runtime in 2022 but Docker-built images work unchanged because the image format (OCI) is a standard.
- **kube-proxy**: programs the node's networking (iptables/IPVS) so that Service IPs route to Pod IPs (slide 23).

minikube runs all of these inside one Docker container on your machine (slide 27). Managed clouds hide the control plane entirely; you only see nodes.

**Likely questions.**
- *Where does `kubectl` get its credentials?* `~/.kube/config`. minikube writes it for you.
- *How many nodes in production?* From 3 to thousands. Control plane is usually 3 for HA.

### Slide 19 · Three objects cover 80 %
**What it says.** Pod, Deployment, Service, glued by labels.

**Fundamentals.**
- **Pod**: the smallest deployable unit. One or more containers that share a network namespace (same IP, can talk over `localhost`) and can share volumes. 95 % of Pods have one container; the "sidecar" pattern adds a helper (log shipper, proxy). Pods are *ephemeral*: when one dies it's not resurrected, a new one with a new name and IP is created. You almost never write `kind: Pod` by hand.
- **ReplicaSet** (not on the slide, mention if asked): "keep N identical Pods running". Created and managed by a Deployment.
- **Deployment**: manages ReplicaSets to give you declarative updates. Change the image → new ReplicaSet scaled up, old scaled down (slide 24). Keeps old ReplicaSets at 0 so you can roll back.
- **Service**: a stable virtual IP and DNS name (`hello-devops.default.svc.cluster.local`) that load-balances to all Pods matching its selector. Types: `ClusterIP` (internal only, default), `NodePort` (also opens a port 30000–32767 on every node), `LoadBalancer` (asks the cloud for an external LB). We use NodePort because minikube has no cloud LB.
- **Labels**: arbitrary `key: value` pairs in metadata. Selectors pick objects by label. This is the entire linking mechanism in Kubernetes; there are no foreign keys.

Other objects they'll meet later: Namespace (logical partition), ConfigMap/Secret (config), Ingress (HTTP routing by host/path), PersistentVolumeClaim (storage), Job/CronJob, StatefulSet, DaemonSet.

**Likely questions.**
- *Why not just a Deployment with 1 replica instead of a Pod?* Exactly what everyone does. A bare Pod isn't restarted on a different node if its node dies; a Deployment's is.
- *Pod vs container?* A Pod wraps containers and adds a shared IP + lifecycle. Think "a Pod is the Kubernetes word for a running container (or small group)".

### Slide 20 · The one idea: desired state
**What it says.** You declare, controllers compare desired vs actual, act, repeat forever.

**Fundamentals.** This is the mental model that makes everything else obvious. Imperative systems (shell scripts, Ansible playbooks run once) do a thing and stop; if the world changes afterwards nothing notices. Kubernetes controllers run a *reconciliation loop*: every few seconds (and on every event), read desired state from the API server, read actual state from the cluster, compute the diff, take one step to close it. Delete a Pod → ReplicaSet controller sees 1 < 2 → creates one. Node dies → Node controller marks Pods lost → ReplicaSet controller recreates them elsewhere. Scale → change the number, loop does the rest.

`kubectl apply` is declarative: send the whole desired object; the server merges it. `kubectl create` fails if it exists; `kubectl apply` is idempotent, so always use `apply`. `kubectl scale` / `kubectl set image` are imperative shortcuts that edit the stored spec for you; the loop still does the work. In teams the YAML in git *is* the desired state (that's GitOps / ArgoCD, slide 42).

### Slide 21 · Every YAML file has the same 4 parts
**What it says.** `apiVersion`, `kind`, `metadata`, `spec`. `status` is written by Kubernetes.

**Fundamentals.** `apiVersion` groups: core objects (Pod, Service, ConfigMap) are `v1`; workload objects (Deployment, ReplicaSet, StatefulSet) are `apps/v1`; batch (Job) is `batch/v1`; Ingress is `networking.k8s.io/v1`. `kubectl api-resources` lists them all with their group. `metadata.name` must be unique per kind per namespace. `metadata.labels` are what selectors match. `spec` is the desired state; its shape depends on `kind`. `status` is observed state (`kubectl get deploy hello-devops -o yaml` shows it). Multiple objects can go in one file separated by `---`, or in one folder applied with `kubectl apply -f k8s/`.

YAML gotchas to pre-empt: indentation is 2 spaces, never tabs; `- ` starts a list item; `key: value` needs the space after the colon; strings with special characters need quotes (`value: "v1"`).

### Slide 22 · k8s/deployment.yaml
Annotations beyond the slide:
- `spec.selector.matchLabels` **must** equal `spec.template.metadata.labels`, or apply fails. The selector is immutable after creation.
- `template` is a full Pod spec. Anything valid in a Pod goes here.
- `imagePullPolicy: IfNotPresent`: use the local image if it exists, otherwise pull. Default for a tag other than `latest` is also IfNotPresent, but `latest` defaults to `Always`, which would fail in minikube with no registry. We set it explicitly to make the point.
- `env`: `APP_VERSION` is read by `index.js`. Same mechanism as `docker run -e`.
- `readinessProbe`: kubelet calls `GET /health` every 5 s starting 2 s after start. Until it returns 2xx the Pod is not "Ready" and the Service won't send it traffic. This is what makes rolling updates zero-downtime. There is also `livenessProbe` (restart the container if it fails) and `startupProbe`.
- Not in the file but production-essential: `resources.requests/limits` (CPU/memory; the scheduler needs requests to place Pods).

### Slide 23 · k8s/service.yaml and how traffic flows
Annotations beyond the slide:
- `port: 80` is the Service's own port; `targetPort: 3000` is the container's. If omitted, targetPort = port.
- The Service gets a ClusterIP (virtual, only inside the cluster) and a DNS name via CoreDNS. Other Pods can `fetch("http://hello-devops")`. That's service discovery solved.
- NodePort additionally allocates a port (30000–32767) on each node. `minikube service hello-devops --url` prints `http://<minikube-ip>:<nodeport>`. With the docker driver that IP is reachable from the Codespace *shell* (it's on the docker network) but not from the browser, so the lab uses it with `curl` in a loop to show load-balancing: the `host` field in `/health` alternates between Pods.
- For the browser we use `kubectl port-forward svc/hello-devops 8080:80`: kubectl opens a tunnel from local port 8080 through the API server to **one** Pod behind the Service and sticks to it for the tunnel's lifetime. So the browser always shows the same host; that's expected, not a bug. VS Code then forwards 8080 to the browser tab.
- Load balancing is done by kube-proxy rules on the node, roughly random across Ready endpoints.

### Slide 24 · Rolling update, step by step
**What it says.** v1 v1 → v1 v1 v2 → v1 v2 v2 → v2 v2. Readiness gates each step. Old ReplicaSet kept at 0 for undo.

**Fundamentals.** Deployment strategy defaults: `RollingUpdate` with `maxSurge: 25 %` (how many extra Pods may exist during the update) and `maxUnavailable: 25 %` (how many may be missing). With 2 replicas that rounds to surge 1, unavailable 0: so exactly the sequence on the slide. The alternative strategy `Recreate` kills all old then starts new (downtime, used when two versions can't coexist). `kubectl rollout status` waits until done; `rollout history` lists revisions; `rollout undo` re-scales the previous ReplicaSet; `rollout undo --to-revision=N` picks one. If the new image never becomes Ready the rollout stalls with old Pods still serving, which is the safe failure mode they'll see in the challenge.

**Likely questions.**
- *What about database migrations?* Hard problem, not solved by K8s. Rule of thumb: make schema changes backwards compatible so v1 and v2 can run side by side during the roll.
- *Blue/green and canary?* Blue/green: two full environments, switch the Service selector. Canary: send 5 % to v2, watch metrics. Both built on the same primitives (two Deployments + Service/Ingress rules).

### Slide 25 · Pod statuses you'll see
Table of statuses with meaning and action. Extra context:
- `READY 0/1` with STATUS `Running` means the readiness probe is failing: the process is up but `/health` isn't returning 200. Check `kubectl describe` Events ("Readiness probe failed") and `kubectl logs`.
- `ErrImagePull` → after a few retries becomes `ImagePullBackOff` (exponential back-off). Same cause.
- `CrashLoopBackOff`: the container exited; kubelet restarts with increasing delay (10 s, 20 s, 40 s… max 5 min). `RESTARTS` column climbs. Almost always an app error: `kubectl logs <pod> --previous` shows the crashed container's output.
- `Pending` for a long time: `describe` Events will say "0/1 nodes are available: insufficient cpu" or similar.
- `Terminating` stuck: usually a finalizer or a process ignoring SIGTERM; `--grace-period=0 --force` as last resort.

The debug loop on the slide (get → describe → logs) solves 90 % of cases. Add `kubectl get events --sort-by=.lastTimestamp` for cluster-wide view.

### Slide 26 · kubectl commands
Reference. Mention the shorthand: `deploy`, `svc`, `po`, `-A` (all namespaces), `-w` (watch), `-o yaml`/`-o wide`, `kubectl explain deployment.spec.strategy` (built-in docs for any field), and `kubectl get all`.

### Slide 27 · Our setup: minikube inside Codespaces
**What it says.** Nesting: browser → Codespace VM → Docker engine → minikube node container → Pods. Lab 1 image lives in the outer Docker; `minikube image load` copies it into minikube's own store.

**Fundamentals.** A Codespace is a VM (default 2 vCPU / 8 GB) running a dev container built from `.devcontainer/devcontainer.json`. Our devcontainer adds two "features": `docker-in-docker` (a Docker daemon inside the dev container) and `kubectl-helm-minikube`. `minikube start --driver=docker` creates one Docker container that acts as a Kubernetes node, with its own containerd and image store inside it. That inner store cannot see the outer Docker's images, hence `minikube image load` (alternatives: `eval $(minikube docker-env)` to point the docker CLI at the inner daemon, or `minikube image build`). With a registry none of this is needed: nodes just pull.

Resource note: the 2-core Codespace runs minikube with `--cpus=2 --memory=3g`. Four replicas of a tiny Node app are fine; don't go to 20.

**Likely questions.**
- *Can I do this on my laptop?* Yes: install Docker Desktop + minikube (or enable Kubernetes in Docker Desktop, or use kind/k3d). Same commands.
- *Is minikube "real" Kubernetes?* Yes, real components, single node. Not for production.

### Slide 28 · Quick check · Kubernetes
Answers:
1. A new Pod appears within seconds with a new name. Desired 2, actual 1, the ReplicaSet controller reconciles. `kubectl get pods -w` shows it live.
2. Through a Service: stable ClusterIP and DNS name, selects Pods by label, load-balances to the Ready ones. Pod IPs are an implementation detail.
3. Typo in image name or tag; image not present where the node can pull it (in our case, not loaded into minikube); for a private registry, missing pull credentials.

### Slide 29 · Kubernetes · 3 things to remember
Desired state; Pod/Deployment/Service; get/describe/logs.

### Slide 30 · Lab 2
In `labs/02-kubernetes.md`. Checkpoints: Pods Running after apply; page visible after port-forward; Pod comes back after delete. Most common failure is `ErrImagePull` from skipping `minikube image load`. Keep the port-forward in its own terminal; students forget it's blocking.

---

## Part 3 · CI/CD and Jenkins (slides 31–40)

### Slide 31 · Section divider
Hook: "You did build → test → run by hand twice today. A real team does it forty times a day."

### Slide 32 · CI, CD and the other CD
**What it says.** Pipeline stages Push → Build → Test → Package → Deploy staging → Deploy prod, with three spans: CI covers build+test(+package); Continuous Delivery means every green build is deployable with a human click; Continuous Deployment means no click.

**Fundamentals.** *Continuous Integration* (term from the late 90s, Extreme Programming) means integrating everyone's work into the shared mainline frequently (at least daily) and verifying each integration with an automated build and tests. The value is early detection: a conflict or regression found 10 minutes after the commit is trivial; found 3 weeks later it's a nightmare. *Continuous Delivery* extends the pipeline so the output of every green run is a releasable artefact (our image) and deploying it is a push-button, low-risk act. *Continuous Deployment* removes the button. Most companies do CI + Delivery; Deployment to prod on every merge is for teams with strong tests and monitoring.

"Runs on a fresh machine every time" is the key property: the pipeline only has what's in git, so it is the objective arbiter of "does this work". That's why CI being red while "it works on my laptop" means the laptop has something git doesn't.

### Slide 33 · Anatomy of any pipeline
**What it says.** Trigger → Runner → Job → Steps → Artefact. Rules: fast, fresh, same every time, red blocks merge. Vocabulary mapping across Actions / Jenkins / GitLab CI.

**Fundamentals.** Trigger types: push, pull request, tag, schedule (cron), manual, another pipeline finishing, external webhook. A runner is a machine (VM or container) that executes jobs; hosted (GitHub's) or self-hosted (your own, needed for GPUs, on-prem access, special licences). Jobs in one pipeline run in parallel unless you declare `needs:`; steps in a job run sequentially on the same runner and share its filesystem. Artefacts are files you keep after the runner is destroyed: test reports, built binaries, container images pushed to a registry. Caching (e.g. `node_modules`) speeds up runs but must never affect correctness.

### Slide 34 · ci.yml annotated
Beyond the slide:
- `on: [push, pull_request]`: runs on every push to any branch, and again on PR events. Deliberately broad so Lab 3 works the moment students push a branch. In a real project you'd narrow pushes to `main` and rely on `pull_request` for branches (`on: { push: { branches: [main] }, pull_request: {} }`). If a student says "nothing happened": forks have workflows disabled until they click the enable button on the Actions tab.
- `uses: actions/checkout@v4`: clones the repo into the runner. Without it the workspace is empty.
- `uses: actions/setup-node@v4`: installs the requested Node version and adds it to PATH. Marketplace actions are just repos with an `action.yml`; `@v4` pins a major version tag.
- `working-directory: app`: our app lives in a subfolder.
- `run:` lines execute in bash on the runner. `${{ github.sha }}` is an expression; the file uses `$GITHUB_SHA`, the equivalent environment variable, to tag the image with the commit hash, the standard way to make images traceable to code.
- The job builds the image but doesn't push it: no registry credentials in a student fork. Adding a `docker/login-action` + `docker push ghcr.io/...` step is the natural next step (slide 42).
- Secrets: `${{ secrets.NAME }}`, set in repo Settings → Secrets. Never commit them.

### Slide 35 · Why it matters: the pull request gate
**What it says.** Push branch → pipeline runs → result on PR → red: fix; green: merge. Mock-ups of the red and green PR checks.

**Fundamentals.** GitHub shows each workflow run as a "check" on the PR. *Branch protection rules* (Settings → Branches) can require checks to pass and reviews to be approved before the merge button activates. This turns CI from "advisory" to "enforced" and keeps `main` always green, which is what makes continuous delivery possible: anything on main is deployable. Lab 3 deliberately breaks `/health` so students see a red check and read a real failure log; reading CI logs is a skill.

### Slide 36 · Jenkins: the self-hosted original
**What it says.** Git repo → (webhook/poll) → Jenkins controller (web UI, scheduler, plugins) → agents run stages. Declarative Jenkinsfile shown next to the card "why it still matters".

**Fundamentals.** Jenkins (2011, forked from Hudson, 2004) is an open-source Java automation server you host yourself. **Controller** (formerly "master"): the web UI, job definitions, scheduling, plugin host. **Agents** (formerly "slaves"): machines or containers that execute the work; can be static VMs, Docker containers spun per build, or Kubernetes Pods. **Plugins** (~1,800): Git, GitHub, Docker, NodeJS tool installer, Slack, Blue Ocean UI… nearly everything is a plugin, which is both its strength and its maintenance burden.

Two ways to define a job:
- **Freestyle**: configure through the UI (what your existing `exercise-3.md` does). Quick, but config lives in Jenkins, not git.
- **Pipeline**: a `Jenkinsfile` in the repo. Two syntaxes: *Declarative* (`pipeline { agent … stages { stage(…) { steps { … } } } }`, what we show; opinionated, readable) and *Scripted* (plain Groovy, more flexible). `agent any` = run on any available agent; `tools { nodejs "node20" }` uses the NodeJS plugin's tool installer named `node20` in Manage Jenkins → Tools; `sh` runs a shell step; `dir("app")` changes directory; `checkout scm` clones the repo the job was configured with; `${BUILD_NUMBER}` is a built-in env var; `post { success/failure }` runs after stages.

Triggers: GitHub webhook to `/github-webhook/` (needs Jenkins reachable from the internet), or "Poll SCM" with a cron (`H/5 * * * *`), fine for a demo.

Demo flow (B's laptop, prepared beforehand): open the Pipeline job, click Build Now, show the stage view turning green, open Console Output, scroll to `npm test` → `✅ test passed`. Then show `jenkins/Jenkinsfile` and `.github/workflows/ci.yml` side by side.

### Slide 37 · GitHub Actions vs Jenkins
Table. The honest summary: Actions wins on zero setup and tight GitHub integration; Jenkins wins when you must self-host, need exotic plugins, or have a decade of existing jobs. GitLab CI, Azure Pipelines, CircleCI, Buildkite, Tekton, Argo Workflows are the same shape. Learn the shape.

### Slide 38 · Quick check · CI/CD
Answers:
1. CI is right. It ran on a clean machine with only what's committed. The laptop has an uncommitted file, a globally installed package, or a different version. The fix is to make the repo self-sufficient, not to make CI "more like my laptop".
2. Delivery: every green build is packaged and *could* be deployed; a human decides when. Deployment: it *is* deployed, automatically.
3. In the repository (`.github/workflows/`, `Jenkinsfile`). Versioned with the code, reviewed in PRs, identical for everyone, and a checkout of any commit can rebuild itself the way it was built then.

### Slide 39 · CI/CD · 3 things to remember
Fresh machine on every push; pipeline is code in the repo; red blocks, green ships.

### Slide 40 · Lab 3
In `labs/03-cicd.md`. Forks have workflows disabled by default: the Actions tab shows a button "I understand my workflows, go ahead and enable them". Tell students up front. The red run comes from changing `/health` to return `broken`; `test.js` asserts `ok`.

---

## Wrap-up (slides 41–43)

### Slide 41 · The big picture, end to end
git push → CI tests → docker build → image to registry → kubectl apply → Pods serve users. Map each lab to the steps (the slide does). Say explicitly what a real company adds: a registry (step 4), a managed cluster instead of minikube (step 5), and usually a GitOps tool (ArgoCD/Flux) that watches the k8s YAML in git and applies it, so even `kubectl apply` is automated.

### Slide 42 · Where to go from here
Concrete next topics per track. If you recommend one thing: have them push their fork with the green Actions badge, then add an image push to GHCR. That's a portfolio-ready repo.

### Slide 43 · Thanks
Keep the repo URL up during Q&A.

---

## Appendix A · Cheat answers for off-script questions

- **Docker vs Podman?** Podman is a daemonless, rootless, CLI-compatible alternative from Red Hat. Same images.
- **What is OCI?** Open Container Initiative: standards for the image format and runtime, so Docker-built images run on containerd, CRI-O, Podman.
- **Helm?** A package manager for Kubernetes: templated YAML ("charts") with values. `helm install prometheus …`.
- **Ingress?** An HTTP router in front of Services: `shop.example.com/api → api-svc`. Needs an Ingress controller (nginx, traefik).
- **Namespaces?** Logical partitions in a cluster (`kubectl get pods -n kube-system` shows the system Pods). Default namespace is `default`.
- **How do containers talk to a DB?** The DB is another Deployment/StatefulSet with a Service; the app uses the Service DNS name, with credentials from a Secret.
- **Terraform?** Infrastructure as code for the layer *below* Kubernetes: VMs, networks, the managed cluster itself.
- **What does an SRE do?** Operates services with engineering: SLOs, on-call, automation, capacity. The Operate/Monitor half of the loop.

## Appendix B · Commands that reset a broken student environment

```bash
# Docker: remove all containers, keep images
docker rm -f $(docker ps -aq) 2>/dev/null
# minikube: nuke and restart (2–3 min)
minikube delete && minikube start --driver=docker --cpus=2 --memory=3g
# Kubernetes: remove our objects only
kubectl delete -f k8s/
# Codespace itself hosed: Code → Codespaces → ... → Delete, create a new one (4 min)
```
