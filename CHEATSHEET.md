# Cheat sheet

## Docker
```bash
docker build -t hello-devops:v1 .           # build image from Dockerfile in current dir
docker images                               # list images
docker run -d -p 3000:3000 --name web hello-devops:v1   # run detached, map port
docker ps                                   # running containers
docker logs web                             # stdout of container
docker exec -it web sh                      # shell inside container
docker stop web && docker rm web            # stop + delete container
docker run --rm -e APP_VERSION=v2 -p 3001:3000 hello-devops:v1   # env var override
```

## Kubernetes (minikube)
```bash
minikube start --driver=docker              # start a 1-node cluster
minikube image load hello-devops:v1         # copy local image into cluster
kubectl apply -f k8s/                       # create/update everything in folder
kubectl get pods -o wide                    # list pods
kubectl get deploy,svc                      # deployments + services
kubectl describe pod <name>                 # events, why it's failing
kubectl logs <pod>                          # container stdout
kubectl port-forward svc/hello-devops 8080:80   # reach the service from browser (one pod)
curl $(minikube service hello-devops --url)/health   # hit the NodePort: load-balanced
kubectl scale deploy hello-devops --replicas=4
kubectl set image deploy/hello-devops hello-devops=hello-devops:v2
kubectl rollout status deploy/hello-devops
kubectl rollout undo deploy/hello-devops
kubectl delete pod <name>                   # watch it get recreated
kubectl delete -f k8s/                      # clean up
minikube dashboard --url                    # web UI (optional)
```

## Git (recap)
```bash
git checkout -b my-feature
git add . && git commit -m "feat: ..."
git push -u origin my-feature               # then open a Pull Request
```
