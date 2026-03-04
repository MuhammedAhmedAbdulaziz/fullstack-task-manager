// ==========================================================
// Jenkinsfile - CI/CD Pipeline (Declarative)
// ==========================================================
// This pipeline automates the full lifecycle for both services:
//   Backend:  Install deps -> Run tests -> Build image -> Push to Docker Hub
//   Frontend: Build image -> Push to Docker Hub
//   Deploy:   Pull latest images and run via docker-compose
// ==========================================================

pipeline {
    // Run on any available Jenkins agent
    agent any

    // ----------------------------------------------------------
    // Environment Variables
    // ----------------------------------------------------------
    // These are available to all stages in the pipeline.
    // Credentials are fetched securely from the Jenkins credential store
    // and are never hardcoded in the pipeline.
    environment {
        // Fetch Docker Hub username and password from Jenkins credentials.
        // The credential ID "dockerhub-credentials" must be configured in
        // Jenkins under: Manage Jenkins > Credentials > System > Global credentials.
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')

        // Extract the username from the credentials binding
        DOCKERHUB_USERNAME    = "${DOCKERHUB_CREDENTIALS_USR}"

        // Tag images with the Jenkins build number for versioning.
        // Falls back to "latest" if BUILD_NUMBER is not available.
        IMAGE_TAG             = "${env.BUILD_NUMBER ?: 'latest'}"

        // Full image names on Docker Hub
        BACKEND_IMAGE         = "azoooz/egcert-devops-assessment-backend"
        FRONTEND_IMAGE        = "azoooz/egcert-devops-assessment-frontend"
    }

    // ----------------------------------------------------------
    // Pipeline Options
    // ----------------------------------------------------------
    options {
        // Abort the pipeline if it runs longer than 30 minutes
        timeout(time: 30, unit: 'MINUTES')

        // Prevent multiple builds from running at the same time
        disableConcurrentBuilds()

        // Keep only the last 10 builds in Jenkins history to save disk space
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ==========================================================
        // BACKEND PIPELINE
        // ==========================================================

        // ----------------------------------------------------------
        // Stage 1: Install backend dependencies
        // ----------------------------------------------------------
        stage('Backend: Prepare') {
            steps {
                // Change into the backend directory
                dir('backend') {
                    echo 'Installing backend dependencies...'

                    // "npm ci" performs a clean install from package-lock.json.
                    // It is faster and more reliable than "npm install" for CI/CD
                    // because it ensures exact dependency versions.
                    sh 'npm ci'
                }
            }
        }

        // ----------------------------------------------------------
        // Stage 2: Run backend unit tests
        // ----------------------------------------------------------
        stage('Backend: Validate') {
            steps {
                dir('backend') {
                    echo 'Running backend unit tests...'

                    // Run Jest tests with --ci flag for non-interactive mode
                    // and --forceExit to ensure Jest terminates properly.
                    sh 'npm test -- --ci --forceExit'
                }
            }
            post {
                // Always attempt to collect test results, even if tests fail.
                // allowEmptyResults prevents the build from failing if no
                // XML report files are found.
                always {
                    junit(testResults: 'backend/test-results/*.xml', allowEmptyResults: true)
                }
            }
        }

        // ----------------------------------------------------------
        // Stage 3: Build backend Docker image and push to Docker Hub
        // ----------------------------------------------------------
        stage('Backend: Build & Ship') {
            steps {
                dir('backend') {
                    echo 'Building backend Docker image...'

                    // Build the Docker image and tag it with both:
                    // - the build number (for versioning, e.g. :5)
                    // - "latest" (so docker-compose always pulls the newest)
                    sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                }
                echo 'Pushing backend image to Docker Hub...'
                sh """
                    # Log in to Docker Hub using credentials from Jenkins.
                    # The password is piped via stdin to avoid it appearing
                    # in the process list or shell history.
                    echo "\${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "\${DOCKERHUB_CREDENTIALS_USR}" --password-stdin

                    # Push both tags to Docker Hub
                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${BACKEND_IMAGE}:latest
                """
            }
        }

        // ==========================================================
        // FRONTEND PIPELINE
        // ==========================================================

        // ----------------------------------------------------------
        // Stage 4: Build frontend Docker image and push to Docker Hub
        // ----------------------------------------------------------
        stage('Frontend: Build & Ship') {
            steps {
                dir('frontend') {
                    echo 'Building frontend Docker image...'

                    // Build the Docker image and tag it with both
                    // the build number and "latest"
                    sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                }
                echo 'Pushing frontend image to Docker Hub...'
                sh """
                    # Push both tags to Docker Hub.
                    # Docker login is still active from the backend stage.
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:latest
                """
            }
        }

        // ==========================================================
        // DEPLOYMENT
        // ==========================================================

        // ----------------------------------------------------------
        // Stage 5: Deploy the full stack using Docker Compose
        // ----------------------------------------------------------
        stage('Deploy') {
            steps {
                echo 'Deploying full stack with Docker Compose...'
                sh """
                    # Set environment variables that docker-compose.yaml references
                    export DOCKERHUB_USERNAME=\${DOCKERHUB_CREDENTIALS_USR}
                    export IMAGE_TAG=${IMAGE_TAG}

                    # Idempotency: Tear down any existing containers and networks
                    # before redeploying. This ensures the pipeline can run multiple
                    # times without failing due to name conflicts or duplicate resources.
                    # "|| true" prevents failure on the first run when nothing exists yet.
                    docker compose -f docker-compose.yaml down --remove-orphans || true

                    # Pull the latest images from Docker Hub
                    docker compose -f docker-compose.yaml pull

                    # Deploy the stack:
                    # --force-recreate: recreate containers even if config has not changed,
                    #   ensuring we always run the latest image.
                    # --remove-orphans: remove containers for services that were removed
                    #   from the compose file. This ensures idempotent deployments.
                    # -d: run in detached mode (background)
                    docker compose -f docker-compose.yaml up -d --force-recreate --remove-orphans

                    echo 'Waiting for services to become healthy...'
                    sleep 15

                    # Print the status of all running containers for verification
                    docker compose -f docker-compose.yaml ps
                """
            }
        }

        // ----------------------------------------------------------
        // Stage 6: Verify that both services are running correctly
        // ----------------------------------------------------------
        stage('Verify Deployment') {
            steps {
                echo 'Running deployment health checks...'
                sh '''
                    # Check backend health endpoint with up to 5 retries
                    BACKEND_HEALTHY=false
                    for i in 1 2 3 4 5; do
                        if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
                            echo "Backend is healthy"
                            BACKEND_HEALTHY=true
                            break
                        fi
                        echo "Waiting for backend... (attempt $i/5)"
                        sleep 5
                    done

                    if [ "$BACKEND_HEALTHY" != "true" ]; then
                        echo "ERROR: Backend health check failed after 5 attempts"
                        exit 1
                    fi

                    # Check frontend is responding with up to 5 retries
                    FRONTEND_HEALTHY=false
                    for i in 1 2 3 4 5; do
                        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
                            echo "Frontend is healthy"
                            FRONTEND_HEALTHY=true
                            break
                        fi
                        echo "Waiting for frontend... (attempt $i/5)"
                        sleep 5
                    done

                    if [ "$FRONTEND_HEALTHY" != "true" ]; then
                        echo "ERROR: Frontend health check failed after 5 attempts"
                        exit 1
                    fi

                    echo "All health checks passed successfully"
                '''
            }
        }
    }

    // ----------------------------------------------------------
    // Post-Pipeline Actions
    // ----------------------------------------------------------
    // These blocks run after all stages complete, regardless of result.
    post {
        // Runs only if the entire pipeline succeeded
        success {
            echo """
            Pipeline completed successfully.
            Backend:  ${BACKEND_IMAGE}:${IMAGE_TAG}
            Frontend: ${FRONTEND_IMAGE}:${IMAGE_TAG}
            App URL:  http://localhost:3000
            API URL:  http://localhost:3001
            API Docs: http://localhost:3001/api/docs
            """
        }

        // Runs only if any stage failed
        failure {
            echo 'Pipeline failed. Check the logs above for details.'
        }

        // Runs after every build (success or failure)
        always {
            // Log out of Docker Hub to remove stored credentials from disk
            sh 'docker logout || true'

            // Remove dangling (unused) Docker images to free up disk space
            sh 'docker image prune -f || true'
        }
    }
}
