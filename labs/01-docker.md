# Lab 1 — Docker (30 min)

Goal: turn the app in `app/` into an image, run it as a container, poke at it.

## 1. Run the app the old way (2 min)
```bash
cd app
npm install
npm start
```
Click the **"Open in Browser"** popup for port 3000 (or the PORTS tab). You should see *Hello DevOps*.
Stop it with `Ctrl+C`. Notice: this needed Node installed. Your laptop might have Node 16, the server Node 22… "works on my machine" starts here.

## 2. Read the Dockerfile (3 min)
Open `app/Dockerfile`. Six lines. Each instruction = one layer:

| Line | What it does |
|---|---|
| `FROM node:20-alpine` | Start from a tiny Linux that already has Node 20 |
| `WORKDIR /app` | `cd /app` inside the image |
| `COPY package.json ./` + `RUN npm install` | Install deps (cached unless package.json changes) |
| `COPY . .` | Copy source code |
| `EXPOSE 3000` | Documentation: app listens on 3000 |
| `CMD ["node","index.js"]` | What runs when the container starts |

## 3. Build the image (3 min)
```bash
docker build -t hello-devops:v1 .
docker images
```
`-t name:tag` names the image. The `.` is the *build context* (which folder to send to Docker).
Run the build a second time — notice it says `CACHED` and finishes instantly.

## 4. Run a container (5 min)
```bash
docker run -d -p 3000:3000 --name web hello-devops:v1
docker ps
```
- `-d` detached (background)
- `-p 3000:3000` host port : container port
- `--name web` so we can refer to it

Open port 3000 in the browser again. Same app, but now running from the image — **no Node on the host needed**.

## 5. Look inside (5 min)
```bash
docker logs web                 # what the app printed
docker exec -it web sh          # get a shell INSIDE the container
  hostname                      # the container id — compare with the page
  ls /app
  ps aux                        # only your node process. No systemd, no SSH — it's just a process
  exit
```

## 6. Same image, different config (5 min)
Environment variables are how you configure containers without rebuilding:
```bash
docker run -d -p 3001:3000 -e APP_VERSION=v2 --name web2 hello-devops:v1
```
Open port 3001 → it shows **v2**. Same image, different behaviour. Two copies of the app running side by side with zero conflict.

## 7. Clean up (2 min)
```bash
docker stop web web2
docker rm web web2
docker ps -a                    # empty
docker images                   # image is still there — containers are disposable, images are not
```

## 8. Challenge (if time)
- Change the `<h1>` text in `index.js`, rebuild as `hello-devops:v2`, run it on port 3002.
- Run `docker history hello-devops:v1` and find which layer is the biggest.
- Try `docker run --rm hello-devops:v1 node -e "console.log(process.version)"` — override the CMD.

✅ Done when: you have built `hello-devops:v1` and opened it in the browser from a container.
Keep the image — Lab 2 uses it.
