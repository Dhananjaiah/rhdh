# Configuration Examples for RHDH

This directory contains example configuration files for running Red Hat Developer Hub (RHDH) locally with Podman.

## Files

- **`app-config.basic.yaml`** - Minimal configuration for local development
- **`app-config.advanced.yaml`** - Advanced configuration with GitHub integration and PostgreSQL
- **`.env.example`** - Example environment variables file
- **`run-rhdh.sh`** - Helper script to start RHDH with Podman

## Quick Start

### Using the Helper Script (Recommended)

```bash
# Run with basic configuration
./run-rhdh.sh basic

# Run with advanced configuration
./run-rhdh.sh advanced
```

### Manual Setup

#### 1. Choose Your Configuration

**For basic setup (recommended for first-time users):**
```bash
mkdir -p ~/rhdh-config
cp app-config.basic.yaml ~/rhdh-config/app-config.yaml
```

**For advanced setup (with GitHub integration):**
```bash
mkdir -p ~/rhdh-config
cp app-config.advanced.yaml ~/rhdh-config/app-config.yaml
cp .env.example .env
# Edit .env with your values
```

#### 2. Run RHDH with Podman

**Basic:**
```bash
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

**Advanced (with environment variables):**
```bash
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  --env-file .env \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

#### 3. Access RHDH

Navigate to: http://localhost:7007

## Configuration Details

### Basic Configuration

The basic configuration includes:
- In-memory database (no persistence)
- Guest authentication
- No external integrations
- Minimal setup for quick start

**Best for:**
- First-time users
- Local testing
- Learning RHDH basics

### Advanced Configuration

The advanced configuration includes:
- PostgreSQL database (persistent)
- GitHub integration for catalog discovery
- GitHub OAuth authentication
- Template locations configured
- TechDocs support

**Best for:**
- Development environments
- Testing GitHub integrations
- Production-like setup

**Requirements:**
- PostgreSQL database (can run in Podman)
- GitHub personal access token
- GitHub OAuth application (for authentication)

## Setting Up Advanced Configuration

### 1. Set Up PostgreSQL

```bash
# Run PostgreSQL in Podman
podman run -d \
  --name rhdh-postgres \
  -e POSTGRES_USER=rhdh \
  -e POSTGRES_PASSWORD=rhdh \
  -e POSTGRES_DB=rhdh \
  -p 5432:5432 \
  postgres:15

# Verify it's running
podman ps | grep postgres
```

### 2. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (all)
   - `read:org`
   - `read:user`
   - `user:email`
4. Copy the token

### 3. Create GitHub OAuth Application (Optional)

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: `RHDH Local`
   - Homepage URL: `http://localhost:7007`
   - Authorization callback URL: `http://localhost:7007/api/auth/github/handler/frame`
4. Copy Client ID and Client Secret

### 4. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your values
nano .env
```

### 5. Update app-config.yaml

Customize `app-config.advanced.yaml` for your needs:
- Update organization name
- Add template locations
- Configure integrations
- Set up catalog providers

## Template Integration

To use the example templates with your RHDH instance:

### Option 1: File Mount (Local Development)

```bash
# Run RHDH with templates mounted
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  -v $(pwd)/../templates:/opt/app-root/src/templates:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

In `app-config.yaml`:
```yaml
catalog:
  locations:
    - type: file
      target: /opt/app-root/src/templates/template-1/template.yaml
    - type: file
      target: /opt/app-root/src/templates/template-2/template.yaml
```

### Option 2: URL (From GitHub)

In `app-config.yaml`:
```yaml
catalog:
  locations:
    - type: url
      target: https://github.com/your-org/rhdh/blob/main/examples/templates/template-1/template.yaml
      rules:
        - allow: [Template]
```

## Customization

### Adding Custom Actions

To add the custom scaffolder actions:

1. Build the custom actions plugin:
   ```bash
   cd ../custom-actions
   yarn install
   yarn build
   ```

2. Mount the plugin in Podman:
   ```bash
   podman run -d \
     --name rhdh \
     -p 7007:7007 \
     -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
     -v $(pwd)/../custom-actions/dist:/opt/app-root/src/custom-actions:Z \
     quay.io/rhdh/rhdh-hub-rhel9:latest
   ```

3. Configure in `app-config.yaml`:
   ```yaml
   dynamicPlugins:
     rootDirectory: /opt/app-root/src/custom-actions
   ```

### Connecting to External Services

Add proxy configurations in `app-config.yaml`:

```yaml
proxy:
  endpoints:
    '/jenkins':
      target: 'https://jenkins.example.com'
      headers:
        Authorization: 'Bearer ${JENKINS_TOKEN}'
    
    '/sonarqube':
      target: 'https://sonarqube.example.com'
      headers:
        Authorization: 'Bearer ${SONARQUBE_TOKEN}'
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
podman logs rhdh

# Common issues:
# - Port 7007 already in use
# - Invalid configuration file
# - Missing environment variables
```

### Can't Connect to PostgreSQL

```bash
# Check PostgreSQL is running
podman ps | grep postgres

# Test connection
psql -h localhost -p 5432 -U rhdh -d rhdh

# If using Podman network, use container name instead of localhost
```

### GitHub Integration Not Working

- Verify GitHub token has correct permissions
- Check token is set in environment variables
- Ensure GitHub organization name is correct
- Review logs for API rate limiting

### Templates Not Showing Up

- Verify template paths are correct
- Check template YAML syntax
- Review catalog logs for errors
- Ensure templates are registered in catalog

## Management Commands

```bash
# View logs
podman logs -f rhdh

# Stop RHDH
podman stop rhdh

# Start RHDH
podman start rhdh

# Restart RHDH
podman restart rhdh

# Remove RHDH (keeps volumes)
podman rm rhdh

# Remove RHDH and volumes
podman rm -v rhdh

# Check resource usage
podman stats rhdh
```

## Backup and Restore

### Backup

```bash
# Backup configuration
cp ~/rhdh-config/app-config.yaml ~/rhdh-config/app-config.yaml.backup

# Export database (if using PostgreSQL)
podman exec rhdh-postgres pg_dump -U rhdh rhdh > rhdh-backup.sql
```

### Restore

```bash
# Restore configuration
cp ~/rhdh-config/app-config.yaml.backup ~/rhdh-config/app-config.yaml

# Restore database
cat rhdh-backup.sql | podman exec -i rhdh-postgres psql -U rhdh -d rhdh
```

## Next Steps

- [Read the Local Setup Guide](../../docs/local-setup-guide.md)
- [Learn about Custom Scaffolder Actions](../../docs/custom-scaffolder-actions.md)
- [Explore Template Examples](../templates/)

## Additional Resources

- [RHDH Documentation](https://access.redhat.com/documentation/en-us/red_hat_developer_hub)
- [Backstage Configuration](https://backstage.io/docs/conf/)
- [Podman Documentation](https://docs.podman.io/)
