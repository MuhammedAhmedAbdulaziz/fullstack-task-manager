# Task Manager 

A containerized full-stack Task Manager application (Next.js frontend and NestJS backend) with an automated Jenkins CI/CD pipeline.

## Architecture Overview

```
Jenkins Pipeline
  Backend:   Prepare > Validate > Build & Ship
  Frontend:  Build & Ship
  Deploy:    docker compose pull & up

Docker Compose (app-network)
  Frontend (Next.js) :3000  --->  Backend (NestJS) :3001
```

## Prerequisites

- Docker 20.10+
- Docker Compose v2+
- Node.js 20 LTS
- Jenkins 2.400+

### Jenkins Plugins Required

- Docker Pipeline
- Pipeline
- Credentials Binding

### Jenkins Credentials Setup

1. Navigate to Manage Jenkins > Credentials > System > Global credentials.
2. Click Add Credentials.
3. Kind: Username with password.
4. ID: `dockerhub-credentials`
5. Username: your Docker Hub username.
6. Password: your Docker Hub access token.

## Quick Start (Local without Jenkins)

```bash
# Clone the repository
git clone https://github.com/MuhammedAhmedAbdulaziz/fullstack-task-manager.git && cd fullstack-task-manager

# Build and run both services
docker compose up -d --build

# Verify
curl http://localhost:3001/health
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger API Docs: http://localhost:3001/api/docs

## Triggering the Jenkins Pipeline

### Option 1: Manual Trigger

1. Open Jenkins dashboard.
2. Click New Item > Pipeline.
3. Under Pipeline, select Pipeline script from SCM.
4. Set SCM to Git and point to your repository URL.
5. Script Path: `Jenkinsfile`
6. Click Build Now.

### Option 2: Webhook (Automated)

1. In Jenkins, enable GitHub hook trigger for GITScm polling in your job config.
2. In GitHub, go to Settings > Webhooks > Add Webhook.
3. Payload URL: `http://<jenkins-host>/github-webhook/`
4. Content type: `application/json`
5. Select: Just the push event.

Every push to the repository will automatically trigger the full pipeline.

## Pipeline Stages

| Stage                      | Description                                             |
|----------------------------|---------------------------------------------------------|
| Backend: Prepare           | Installs npm dependencies with `npm ci`                 |
| Backend: Validate          | Runs the unit test suite via `npm test`                 |
| Backend: Build & Ship      | Builds Docker image and pushes to Docker Hub            |
| Frontend: Build & Ship     | Builds production Docker image and pushes to Docker Hub |
| Deploy                     | Pulls latest images and deploys via `docker compose up` |
| Verify Deployment          | Health checks against both services                     |

## Docker Strategy

### Multi-Stage Builds

Both Dockerfiles use three-stage builds to minimize the final image size:

1. deps - installs dependencies using `npm ci`.
2. builder - compiles the application.
3. production - copies only build artifacts and runs as a non-root user.

### Security Practices

- Non-root user (appuser) inside containers.
- .dockerignore files exclude node_modules, .git, .env, and other unnecessary files.
- Docker Hub credentials stored in Jenkins credential store, never hardcoded.
- `docker logout` runs in the pipeline post-always block.

### Idempotency

- `docker compose up -d --force-recreate --remove-orphans` ensures clean state on every run.
- Named network (task-manager-network) prevents duplicate network creation.
- Named containers prevent resource duplication across deployments.

## Environment Variables

| Variable             | Default                 | Description                    |
|----------------------|-------------------------|--------------------------------|
| DOCKERHUB_USERNAME   | azoooz                  | Docker Hub username for images |
| IMAGE_TAG            | latest                  | Image tag (set to build number)|
| BACKEND_PORT         | 3001                    | Host port for the backend      |
| FRONTEND_PORT        | 3000                    | Host port for the frontend     |
| CORS_ORIGIN          | http://localhost:3000    | Allowed CORS origin            |

## Project Structure

```
.
|-- backend/
|   |-- src/                  # NestJS source code
|   |-- test/                 # E2E tests
|   |-- Dockerfile            # Multi-stage backend image
|   |-- .dockerignore
|   |-- package.json
|-- frontend/
|   |-- src/                  # Next.js source code
|   |-- Dockerfile            # Multi-stage frontend image
|   |-- .dockerignore
|   |-- package.json
|-- docker-compose.yaml       # Orchestration for both services
|-- Jenkinsfile               # CI/CD pipeline definition
|-- README.md
```
