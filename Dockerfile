# Production image for the APL meeting room prototype.
#
# Railway auto-detects this Dockerfile at the repo root — no railway.json/toml needed.
# Deploys are driven by GitHub Actions (`railway up`, see .github/workflows/deploy.yml),
# not Railway's GitHub integration. Deployment setup is documented in README.md.

# Build stage: full dev install, then the Vite/React Router production build.
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Varlock validates the env contract (.env.schema) during `vite build`, and Vite inlines
# this PUBLIC Mapbox token (see .env.schema — deliberately not a secret) into the client
# bundle. Railway exposes service variables to Dockerfile builds only when declared as
# ARGs, so a missing token fails the build here, loudly, instead of breaking the map at
# runtime.
ARG VITE_APP_MAPBOX_TOKEN
RUN node --run build

# Prod-deps stage: runtime node_modules only, cached independently of source changes.
FROM node:24-slim AS prod-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Runtime stage: server bundle + static assets + production dependencies.
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
# The server boots through `varlock run` (the `start` script), which validates the
# env contract at startup — so the schema ships with the image, and every @required
# variable (VITE_APP_MAPBOX_TOKEN included) must also be present in the RUNTIME env.
COPY .env.schema ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
# Migrations are applied at boot by the libSQL migrator (db/client.server.ts).
COPY drizzle ./drizzle

# node owns the workdir: varlock regenerates env.d.ts on load, and the file: fallback
# database lands in data/ when APL_DB_URL is unset (local `docker run`). On Railway,
# APL_DB_URL points at the libSQL server and the container stays stateless.
RUN mkdir -p data && chown node:node /app data
USER node

# react-router-serve honors PORT (Railway injects its own) and binds all interfaces.
ENV PORT=3000
EXPOSE 3000

CMD ["node", "--run", "start"]
