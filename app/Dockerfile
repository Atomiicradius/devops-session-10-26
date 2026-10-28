# 1. Base image: small Linux + Node 20 already installed
FROM node:20-alpine

# 2. Working directory inside the container
WORKDIR /app

# 3. Copy dependency manifest first (cached layer: re-runs only when it changes)
COPY package.json ./
RUN npm install --omit=dev

# 4. Copy the rest of the source
COPY . .

# 5. Document the port the app listens on
EXPOSE 3000

# 6. Command to run when the container starts
CMD ["node", "index.js"]
