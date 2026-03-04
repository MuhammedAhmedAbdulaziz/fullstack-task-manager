# ==========================================================
# Backend Dockerfile (NestJS) - Multi-Stage Build
# ==========================================================
# This Dockerfile uses three stages to produce a minimal,
# secure production image. Only the compiled output and
# production dependencies are included in the final image.
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
# Stage 2: builder - Compile TypeScript to JavaScript
# ----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire source code into the builder stage
COPY . .

# Run the NestJS build command which compiles TypeScript into
# JavaScript and outputs it to the ./dist directory
RUN npm run build

# ----------------------------------------------------------
# Stage 3: prod-deps - Install only production dependencies
# ----------------------------------------------------------
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install only production dependencies, omitting devDependencies.
# This produces a much smaller node_modules without typescript,
# jest, eslint, and other build/test tools.
RUN npm ci --omit=dev

# ----------------------------------------------------------
# Stage 4: production - Final lightweight image
# ----------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Set Node.js to production mode to disable dev tooling and
# enable performance optimizations
ENV NODE_ENV=production

# Create a non-root user and group for running the application.
# This follows the security best practice of least privilege,
# preventing the app from running as root inside the container.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what is needed to run the application:
# - node_modules from prod-deps stage (production dependencies only)
# - dist folder from builder stage (compiled JavaScript)
# - package.json for Node.js module resolution
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Switch to the non-root user before running the application
USER appuser

# Document the port the backend listens on
EXPOSE 3001

# Configure a health check so Docker and orchestrators (like docker-compose)
# can monitor whether the container is still responding.
# It hits the /health endpoint every 30 seconds.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Start the NestJS application by running the compiled main.js
CMD ["node", "dist/main"]
