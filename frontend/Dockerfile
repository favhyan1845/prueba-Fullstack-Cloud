# ───────────────────────────────────────────────────────────────────────────
# Code Insight AI - Frontend (Angular 17)
# Multi-stage build: deps → build → nginx runtime
# ───────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ───────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx ng build --configuration=production

# ───────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist/code-insight-frontend/browser /usr/share/nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80