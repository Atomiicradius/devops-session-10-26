# Lab 2 — Kubernetes on minikube (30 min)

Goal: run the image from Lab 1 on a real (single-node) Kubernetes cluster. Scale it, break it, roll it out, roll it back.

## 0. Is the cluster up? (2 min)
```bash
minikube status
kubectl get nodes
```
You should see one node, `Ready`. If minikube isn't running: `minikube start --driver=docker --cpus=2 --memory=3g`.

## 1. Get the image into the cluster (2 min)
minikube has its *own* Docker inside it. It can't see your Lab 1 image yet:
```bash
cd ..                              # back to the repo root
minikube image load hello-devops:v1
minikube image ls | grep hello
```

## 2. Read the manifests (4 min)
Open `k8s/deployment.yaml` and `k8s/service.yaml`.
- **Deployment**: "I want 2 copies (replicas) of this container, matching label `app: hello-devops`."
- **Service**: "Give these Pods one stable name + IP, and spread traffic across them."

## 3. Deploy (4 min)
```bash
kubectl apply -f k8s/
kubectl get pods            # wait until both show Running 1/1
kubectl get deploy,svc
```
Try `kubectl get pods -w` to watch them come up (Ctrl+C to stop).

## 4. Reach the app (4 min)
Two ways. First, the browser:
```bash
kubectl port-forward svc/hello-devops 8080:80
```
Open port 8080 in the browser. You see the app served by **one** Pod (port-forward tunnels to a single Pod and sticks to it). Press `Ctrl+C` when done, or leave it running in its own terminal.

Now see the Service load-balance. The NodePort is reachable from the Codespace shell:
```bash
URL=$(minikube service hello-devops --url)
for i in $(seq 6); do curl -s $URL/health; echo; done
```
The `host` field alternates between the two Pod names. That's the Service spreading requests across Pods.

## 5. Scale (3 min)
In another terminal:
```bash
kubectl scale deploy hello-devops --replicas=4
kubectl get pods
```
Four pods. Run the curl loop again — now four different hosts. Scale back to 2 afterwards.

## 6. Self-healing (3 min)
```bash
kubectl get pods
kubectl delete pod <paste-one-pod-name>
kubectl get pods
```
Kubernetes noticed it had 1 instead of 2 and made a new one. Nobody got paged.

## 7. Rolling update (5 min)
Build a v2 and roll it out with zero downtime:
```bash
cd app
sed -i 's/Hello DevOps 👋/Hello Kubernetes 🚀/' index.js
docker build -t hello-devops:v2 .
minikube image load hello-devops:v2
cd ..
kubectl set image deploy/hello-devops hello-devops=hello-devops:v2
kubectl rollout status deploy/hello-devops
kubectl get pods            # new pod names
```
Reload the browser tab (restart port-forward if needed) → new heading. (Version still says v1 because that's an env var — change it in `deployment.yaml` and `kubectl apply -f k8s/` if you want.)

## 8. Roll back (2 min)
```bash
kubectl rollout history deploy/hello-devops
kubectl rollout undo deploy/hello-devops
kubectl rollout status deploy/hello-devops
```
Reload → old heading is back. That's the "oops" button.

## 9. Debug like a pro (2 min)
```bash
kubectl describe pod <pod-name>     # Events at the bottom = why things fail
kubectl logs <pod-name>
kubectl logs -l app=hello-devops --all-containers   # logs from all pods
```

## 10. Clean up
```bash
kubectl delete -f k8s/
```

## Challenge (if time)
- Edit `deployment.yaml` to set image `hello-devops:v3` (which doesn't exist), apply, and watch `kubectl get pods`. What status do you see? Fix it with `rollout undo`.
- `minikube dashboard --url` and open the web UI.

✅ Done when: you've seen the curl loop hit different Pods, scaled to 4, deleted a pod and watched it come back, and rolled out + rolled back v2.
