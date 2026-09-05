# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# The Next.js rewrites proxy (/api -> backend) is resolved at build time,
# so the backend DNS name of the compose service is baked in here.
ARG API_PROXY_TARGET=http://localhost:5000
ENV API_PROXY_TARGET=$API_PROXY_TARGET

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Standalone output traces the exact node_modules this app needs at runtime.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]