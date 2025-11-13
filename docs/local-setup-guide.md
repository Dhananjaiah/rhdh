# Local RHDH Setup Guide with Podman

This guide provides step-by-step instructions for setting up Red Hat Developer Hub (RHDH) locally using Podman.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installing Podman](#installing-podman)
3. [Running RHDH with Podman](#running-rhdh-with-podman)
4. [Configuration](#configuration)
5. [Authentication Setup](#authentication-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Podman**: Version 4.0 or later
- **System Requirements**:
  - 4GB RAM minimum (8GB recommended)
  - 10GB free disk space
  - Internet connection for pulling images
- **Basic Knowledge**:
  - Container concepts
  - Command line operations
  - YAML configuration

## Installing Podman

### For Linux (RHEL/Fedora/CentOS)

```bash
# Install Podman
sudo dnf install -y podman

# Verify installation
podman --version
```

### For Linux (Ubuntu/Debian)

```bash
# Add repository
sudo apt-get update
sudo apt-get -y install podman

# Verify installation
podman --version
```

### For macOS

```bash
# Install using Homebrew
brew install podman

# Initialize and start Podman machine
podman machine init
podman machine start

# Verify installation
podman --version
```

### For Windows (WSL2)

```bash
# Inside WSL2 Ubuntu
sudo apt-get update
sudo apt-get -y install podman

# Verify installation
podman --version
```

## Running RHDH with Podman

### Step 1: Pull the RHDH Image

```bash
# Pull the latest RHDH image
podman pull quay.io/rhdh/rhdh-hub-rhel9:latest

# Verify the image
podman images | grep rhdh
```

### Step 2: Create Configuration Directory

```bash
# Create a directory for RHDH configuration
mkdir -p ~/rhdh-config
cd ~/rhdh-config
```

### Step 3: Create Basic app-config.yaml

Create a file `~/rhdh-config/app-config.yaml`:

```yaml
app:
  title: Red Hat Developer Hub - Local
  baseUrl: http://localhost:7007

organization:
  name: My Organization

backend:
  baseUrl: http://localhost:7007
  listen:
    port: 7007
    host: 0.0.0.0
  csp:
    connect-src: ["'self'", 'http:', 'https:']
  cors:
    origin: http://localhost:7007
    methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
    credentials: true
  database:
    client: better-sqlite3
    connection: ':memory:'

catalog:
  rules:
    - allow: [Component, System, API, Resource, Location, Template]
  
  locations:
    # Example organization structure
    - type: url
      target: https://github.com/backstage/backstage/blob/master/packages/catalog-model/examples/all.yaml

scaffolder:
  # Default templates
  defaultAuthor:
    name: RHDH User
    email: user@example.com
  defaultCommitMessage: 'Initial commit from RHDH scaffolder'

# Authentication - Guest mode for local development
auth:
  providers:
    guest: {}

# Allow all templates and components
permission:
  enabled: false
```

### Step 4: Run RHDH Container

#### Basic Run (Temporary)

```bash
# Run RHDH with the configuration
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

#### Run with Volume Persistence

```bash
# Create volumes for persistent data
podman volume create rhdh-data
podman volume create rhdh-plugins

# Run with volumes
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  -v rhdh-data:/opt/app-root/src/data:Z \
  -v rhdh-plugins:/opt/app-root/src/dynamic-plugins:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

#### Run with Environment Variables

```bash
# Run with custom environment variables
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -e NODE_ENV=development \
  -e LOG_LEVEL=debug \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

### Step 5: Verify RHDH is Running

```bash
# Check container status
podman ps | grep rhdh

# View logs
podman logs rhdh

# Follow logs in real-time
podman logs -f rhdh
```

### Step 6: Access RHDH

1. Open your web browser
2. Navigate to: http://localhost:7007
3. You should see the RHDH interface

## Configuration

### Advanced app-config.yaml

Here's a more comprehensive configuration example:

```yaml
app:
  title: Red Hat Developer Hub - Local Development
  baseUrl: http://localhost:7007

organization:
  name: My Organization

backend:
  baseUrl: http://localhost:7007
  listen:
    port: 7007
    host: 0.0.0.0
  csp:
    connect-src: ["'self'", 'http:', 'https:']
    upgrade-insecure-requests: false
  cors:
    origin: http://localhost:7007
    methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
    credentials: true
  database:
    client: better-sqlite3
    connection: ':memory:'
  cache:
    store: memory

integrations:
  github:
    - host: github.com
      # For public repositories (no token needed for read-only)
      # For private repositories, add token:
      # token: ${GITHUB_TOKEN}

catalog:
  rules:
    - allow: [Component, System, API, Resource, Location, Template, Group, User]
  
  providers:
    github:
      # Configure GitHub as a catalog provider
      providerId:
        organization: 'your-org'
        catalogPath: '/catalog-info.yaml'
        filters:
          branch: 'main'
          repository: '.*'
  
  locations:
    # Local templates
    - type: file
      target: ./templates/template-1/template.yaml
    # Remote templates
    - type: url
      target: https://github.com/backstage/software-templates/blob/main/scaffolder-templates/react-ssr-template/template.yaml
      rules:
        - allow: [Template]

scaffolder:
  defaultAuthor:
    name: RHDH Scaffolder
    email: scaffolder@example.com
  defaultCommitMessage: 'Scaffolded from RHDH'

# Techdocs for documentation
techdocs:
  builder: 'local'
  generator:
    runIn: 'local'
  publisher:
    type: 'local'

auth:
  providers:
    guest: {}
    # GitHub OAuth (optional)
    # github:
    #   development:
    #     clientId: ${GITHUB_CLIENT_ID}
    #     clientSecret: ${GITHUB_CLIENT_SECRET}

permission:
  enabled: false
```

### Using Environment Variables

Create a `.env` file:

```bash
# .env file
GITHUB_TOKEN=your_github_token_here
POSTGRES_USER=rhdh
POSTGRES_PASSWORD=secure_password
LOG_LEVEL=info
```

Run with environment file:

```bash
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  --env-file .env \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

## Authentication Setup

### Guest Authentication (Development)

Already configured in the basic setup - allows immediate access without login.

### GitHub OAuth (Production-like)

1. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Set:
     - Application name: "RHDH Local"
     - Homepage URL: http://localhost:7007
     - Authorization callback URL: http://localhost:7007/api/auth/github/handler/frame

2. Update app-config.yaml:

```yaml
auth:
  environment: development
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
        signIn:
          resolvers:
            - resolver: usernameMatchingUserEntityName
```

3. Run with environment variables:

```bash
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -e GITHUB_CLIENT_ID=your_client_id \
  -e GITHUB_CLIENT_SECRET=your_client_secret \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

## Verification

### Health Check

```bash
# Check if RHDH is responding
curl http://localhost:7007/healthcheck

# Expected output: {"status":"ok"}
```

### API Check

```bash
# Check catalog API
curl http://localhost:7007/api/catalog/entities | jq
```

### UI Access

1. Open browser to http://localhost:7007
2. You should see:
   - RHDH home page
   - Navigation menu
   - Catalog (empty or with sample data)
   - Create (scaffolder templates)

## Container Management

### Useful Podman Commands

```bash
# Start stopped container
podman start rhdh

# Stop running container
podman stop rhdh

# Restart container
podman restart rhdh

# Remove container
podman rm rhdh

# View logs
podman logs rhdh

# Follow logs
podman logs -f rhdh

# Execute command in container
podman exec -it rhdh /bin/bash

# Inspect container
podman inspect rhdh

# View resource usage
podman stats rhdh
```

### Updating RHDH

```bash
# Pull latest image
podman pull quay.io/rhdh/rhdh-hub-rhel9:latest

# Stop and remove old container
podman stop rhdh
podman rm rhdh

# Run new container
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

## Troubleshooting

### Container Won't Start

**Issue**: Container exits immediately

```bash
# Check logs
podman logs rhdh

# Common issues:
# 1. Port already in use
sudo lsof -i :7007
# Kill process using the port or use different port

# 2. Configuration error
# Validate app-config.yaml syntax
```

**Solution**: Run with different port

```bash
podman run -d \
  --name rhdh \
  -p 8080:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

### Permission Denied on Volume Mount

**Issue**: SELinux preventing volume mount

```bash
# Error: Permission denied

# Solution: Add :Z or :z flag to volume mount
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

### Can't Access RHDH UI

**Issue**: Browser can't connect to http://localhost:7007

**Checks**:
1. Verify container is running:
   ```bash
   podman ps | grep rhdh
   ```

2. Check logs for errors:
   ```bash
   podman logs rhdh | tail -50
   ```

3. Verify port binding:
   ```bash
   podman port rhdh
   ```

4. Test connectivity:
   ```bash
   curl -v http://localhost:7007/healthcheck
   ```

### Database Issues

**Issue**: Database connection errors

**Solution**: Use in-memory database for development

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
```

Or use PostgreSQL:

```bash
# Start PostgreSQL container
podman run -d \
  --name rhdh-postgres \
  -e POSTGRES_USER=rhdh \
  -e POSTGRES_PASSWORD=rhdh \
  -e POSTGRES_DB=rhdh \
  -p 5432:5432 \
  postgres:15

# Update app-config.yaml
backend:
  database:
    client: pg
    connection:
      host: localhost
      port: 5432
      user: rhdh
      password: rhdh
      database: rhdh
```

### Network Issues Between Containers

**Issue**: RHDH can't connect to other containers

**Solution**: Use Podman network

```bash
# Create network
podman network create rhdh-network

# Run PostgreSQL on network
podman run -d \
  --name rhdh-postgres \
  --network rhdh-network \
  -e POSTGRES_USER=rhdh \
  -e POSTGRES_PASSWORD=rhdh \
  -e POSTGRES_DB=rhdh \
  postgres:15

# Run RHDH on same network
podman run -d \
  --name rhdh \
  --network rhdh-network \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest

# In app-config.yaml, use container name as host:
backend:
  database:
    client: pg
    connection:
      host: rhdh-postgres  # Container name
      port: 5432
```

### Memory Issues

**Issue**: Container running out of memory

**Solution**: Increase memory limit

```bash
podman run -d \
  --name rhdh \
  --memory=4g \
  --memory-swap=4g \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

## Next Steps

After successfully setting up RHDH locally:

1. **Explore the Catalog**: Add your own components and services
2. **Try Templates**: Use existing scaffolder templates to create projects
3. **Create Custom Actions**: Follow the [Custom Scaffolder Actions Guide](custom-scaffolder-actions.md)
4. **Integrate with GitHub**: Connect your GitHub repositories
5. **Add Plugins**: Extend RHDH with additional plugins

## Additional Resources

- [RHDH Official Documentation](https://access.redhat.com/documentation/en-us/red_hat_developer_hub)
- [Backstage Documentation](https://backstage.io/docs)
- [Podman Documentation](https://docs.podman.io/)
- [Custom Scaffolder Actions Guide](custom-scaffolder-actions.md)

## Production Considerations

For production deployments, consider:

- **Using PostgreSQL** instead of in-memory database
- **Implementing proper authentication** (OAuth, SAML, etc.)
- **Setting up TLS/SSL** for secure connections
- **Using secrets management** (Vault, sealed secrets)
- **Implementing backup strategies**
- **Setting up monitoring and logging**
- **Using Kubernetes/OpenShift** for orchestration
- **Implementing high availability**
