# syntax=docker/dockerfile:1
# Stage 1: Build static assets with Node.js
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build-time configuration.
#
# Vite reads VITE_* at BUILD time and compiles the values into the bundle, so
# these cannot be set on the running container — the bundle would never see them.
#
# Deliberately no defaults. `ENV VITE_API_BASE_URL=https://api.webxite.org` used
# to be set here, and a real environment variable beats an `.env` file in Vite —
# so the committed `.env.production`, which documents itself as the place to
# change the API address, was silently ignored for every Docker build. Two files
# claiming to configure one value, one of them dead.
#
# `.env.production` is now the single source of truth. These args override it for
# one build without editing it, via a `.local` file, which is the precedence Vite
# already defines and which `.gitignore` already excludes.
ARG VITE_API_BASE_URL
ARG VITE_STUDIO_BASE_URL

RUN if [ -n "$VITE_API_BASE_URL" ]; then \
      echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" >> .env.production.local; \
    fi; \
    if [ -n "$VITE_STUDIO_BASE_URL" ]; then \
      echo "VITE_STUDIO_BASE_URL=$VITE_STUDIO_BASE_URL" >> .env.production.local; \
    fi; \
    npm run build

# Stage 2: Serve static assets with Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 5174 3000
CMD ["nginx", "-g", "daemon off;"]
