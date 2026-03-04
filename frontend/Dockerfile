# ==========================================================
# Frontend Dockerfile (Next.js) - Multi-Stage Build
# ==========================================================
# This Dockerfile uses three stages to produce a minimal,
# secure production image. The Next.js "standalone" output
# mode is used to bundle only the necessary server files,
# resulting in a much smaller final image.
# ==========================================================

# ----------------------------------------------------------
# Stage 1: deps - Install all npm dependencies
# ----------------------------------------------------------
# Using Alpine variant for a smaller base image (~50MB vs ~350MB)
FROM node:20-alpine AS deps

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first to leverage Docker layer caching.
# If these files haven't changed, Docker reuses the cached npm ci layer.
COPY package.json package-lock.json ./

# Install dependencies using "npm ci" for deterministic, reproducible builds.
# "npm ci" is preferred over "npm install" in CI/CD environments because
# it installs exact versions from package-lock.json.
RUN npm ci

# ----------------------------------------------------------
# Stage 2: builder - Build the Next.js application
# ----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire source code into the builder stage
COPY . .

# NEXT_PUBLIC_API_URL must be set at build time because Next.js
# inlines environment variables prefixed with NEXT_PUBLIC_ into
# the JavaScript bundle during the build process.
# Default value points to localhost for local development.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Create the public directory if it does not exist.
# Next.js expects this folder during the build, and the COPY
# instruction in the production stage will fail if it is missing.
RUN mkdir -p public

# Build the Next.js application. Because next.config.js has
# output: 'standalone', this produces a self-contained server
# in .next/standalone that does not need node_modules at runtime.
RUN npm run build

# ----------------------------------------------------------
# Stage 3: production - Final lightweight image
# ----------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Set Node.js to production mode
ENV NODE_ENV=production

# Bind the Next.js standalone server to all network interfaces.
# Without this, the server binds to the container's hostname and
# health checks against localhost:3000 will fail.
ENV HOSTNAME=0.0.0.0

# Create a non-root user and group for running the application.
# This follows the security best practice of least privilege,
# preventing the app from running as root inside the container.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the standalone server output. This includes a minimal
# Node.js server and only the dependencies actually used by
# the application, making the image much smaller than copying
# the full node_modules.
COPY --from=builder /app/.next/standalone ./

# Copy the static assets (CSS, JS chunks, images) generated
# during the build. These are served directly by the Next.js server.
COPY --from=builder /app/.next/static ./.next/static

# Copy the public directory which contains any static files
# (favicons, images, etc.) that should be served as-is.
COPY --from=builder /app/public ./public

# Switch to the non-root user before running the application
USER appuser

# Document the port the frontend listens on
EXPOSE 3000

# Configure a health check so Docker and orchestrators (like docker-compose)
# can monitor whether the container is still responding.
# It hits the root page every 30 seconds.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000 || exit 1

# Start the Next.js standalone server.
# The standalone output generates a server.js file at the root
# which replaces the need for "next start".
CMD ["node", "server.js"]
