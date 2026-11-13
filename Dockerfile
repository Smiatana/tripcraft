# ---- Stage 1: Build the frontend bundle ----
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Improve npm resilience on slower/flaky connections
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000

# Install all dependencies (including Vite & TypeScript build tools)
COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source and build production static assets into /app/dist
COPY . .
RUN npm run build


# ---- Stage 2: Lean production runtime ----
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000

# Install only the production runtime packages required by server.ts
RUN printf '{"name":"tripcraft","private":true,"type":"module"}\n' > package.json \
  && npm install --no-audit --no-fund \
     express@^4.21.2 \
     @google/genai@^2.4.0 \
     dotenv@^17.2.3 \
     tsx@^4.21.0 \
  && npm cache clean --force

# Copy built frontend and Express server
COPY --from=builder /app/dist ./dist
COPY server.ts ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./node_modules/.bin/tsx", "server.ts"]
