# Getting Started with RHDH

This guide will walk you through setting up Red Hat Developer Hub (RHDH) locally and creating your first custom scaffolder action.

## Prerequisites

Before you begin, ensure you have:

✅ **Podman installed** - [Installation Guide](https://podman.io/getting-started/installation)  
✅ **4GB RAM available**  
✅ **10GB free disk space**  
✅ **Internet connection**  
✅ **Basic command line knowledge**

### Verify Prerequisites

```bash
# Check Podman version
podman --version
# Should show version 4.0 or higher

# Check available memory
free -h

# Check disk space
df -h
```

## Step-by-Step Setup

### Step 1: Clone or Download the Repository

```bash
# Clone the repository (or download and extract)
git clone https://github.com/Dhananjaiah/rhdh.git
cd rhdh
```

### Step 2: Run RHDH

The easiest way to get started is using the provided script:

```bash
cd examples/config
chmod +x run-rhdh.sh
./run-rhdh.sh basic
```

**What this does:**
1. Pulls the RHDH container image
2. Creates a configuration directory
3. Copies the basic configuration
4. Starts RHDH in a container
5. Mounts example templates

**Expected output:**
```
===================================
RHDH Local Setup with Podman
===================================

✓ Podman is installed: podman version 4.x.x
✓ Configuration copied to ~/rhdh-config/app-config.yaml
✓ Image pulled successfully
✓ RHDH container started
✓ RHDH is ready!

===================================
RHDH is running!
===================================

Access RHDH at: http://localhost:7007
```

### Step 3: Access RHDH

Open your web browser and navigate to:

```
http://localhost:7007
```

You should see the RHDH home page!

### Step 4: Explore RHDH

#### View the Catalog

1. Click **"Catalog"** in the navigation menu
2. You'll see any registered components, systems, and APIs

#### Explore Templates

1. Click **"Create"** in the navigation menu
2. You'll see available scaffolder templates
3. Currently, you'll see example templates if they're registered

### Step 5: Register Example Templates

To use the example templates:

#### Option A: Via UI (Recommended for beginners)

1. Go to **Create** → **Register Existing Component**
2. Enter the template URL (for local setup):
   ```
   file:///opt/app-root/src/templates/template-1/template.yaml
   ```
3. Click **Analyze**
4. Click **Import**
5. Repeat for Template 2:
   ```
   file:///opt/app-root/src/templates/template-2/template.yaml
   ```

#### Option B: Via Configuration

Edit `~/rhdh-config/app-config.yaml` and add:

```yaml
catalog:
  locations:
    - type: file
      target: /opt/app-root/src/templates/template-1/template.yaml
      rules:
        - allow: [Template]
    
    - type: file
      target: /opt/app-root/src/templates/template-2/template.yaml
      rules:
        - allow: [Template]
```

Then restart RHDH:

```bash
podman restart rhdh
```

### Step 6: Use a Template

Now let's use Template 1, which demonstrates triggering another template:

1. Go to **Create**
2. Select **"Main Application Template"**
3. Fill in the form:
   - **Application Name**: `my-app` (lowercase, no spaces)
   - **Description**: `My first application`
   - **Create Dependent Service**: ✅ Check this box
   - **Repository Location**: Configure your GitHub repository details
4. Click **Review**
5. Click **Create**

**What happens:**
1. RHDH creates your main application (Template 1)
2. Publishes it to GitHub
3. Registers it in the catalog
4. **Triggers Template 2** to create a dependent service
5. Shows you links to both repositories and the triggered task

### Step 7: Build Custom Actions

To enable the custom `trigger:template` action:

```bash
# Navigate to custom actions directory
cd examples/custom-actions

# Install dependencies
yarn install

# Build the actions
yarn build
```

**Output should show:**
```
✨ Done in X.XXs
```

The custom actions are now built in the `dist/` directory.

### Step 8: Integrate Custom Actions (Optional)

To use custom actions in your RHDH instance, you need to mount them into the container.

**Stop current RHDH:**
```bash
podman stop rhdh
podman rm rhdh
```

**Start with custom actions:**
```bash
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  -v $(pwd)/examples/templates:/opt/app-root/src/templates:Z \
  -v $(pwd)/examples/custom-actions/dist:/opt/app-root/src/custom-actions:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

## Next Steps

Congratulations! You now have RHDH running locally. Here are some next steps:

### Learn More

- 📖 Read the [Local Setup Guide](docs/local-setup-guide.md) for detailed configuration options
- 🛠️ Learn about [Custom Scaffolder Actions](docs/custom-scaffolder-actions.md)
- 📝 Explore [Configuration Examples](examples/config/README.md)
- 🎯 Study [Template Examples](examples/templates/README.md)

### Try Advanced Features

1. **Set up GitHub integration:**
   - Create a GitHub personal access token
   - Use the advanced configuration
   - Connect your repositories

2. **Use PostgreSQL:**
   - Run PostgreSQL in a container
   - Update configuration to use it
   - Get persistent data storage

3. **Create your own template:**
   - Copy an existing template
   - Customize for your needs
   - Register it in RHDH

4. **Build more custom actions:**
   - Create actions for your workflow
   - Integrate with internal systems
   - Automate complex processes

### Useful Commands

```bash
# View RHDH logs
podman logs -f rhdh

# Stop RHDH
podman stop rhdh

# Start RHDH
podman start rhdh

# Restart RHDH
podman restart rhdh

# Remove RHDH container
podman rm rhdh

# Check RHDH status
podman ps | grep rhdh

# Check resource usage
podman stats rhdh
```

## Common Issues and Solutions

### Issue: Port 7007 already in use

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :7007

# Kill the process or use a different port
podman run -d --name rhdh -p 8080:7007 ...
```

### Issue: Container exits immediately

**Solution:**
```bash
# Check logs
podman logs rhdh

# Common causes:
# - Invalid configuration file
# - Missing permissions
# - Resource constraints
```

### Issue: Templates not showing

**Solution:**
```bash
# Check if templates are registered
curl http://localhost:7007/api/catalog/entities?filter=kind=Template

# Verify template YAML is valid
yamllint examples/templates/template-1/template.yaml

# Check RHDH logs
podman logs rhdh | grep -i template
```

### Issue: Permission denied on volumes

**Solution:**
```bash
# Add :Z flag to volumes (for SELinux)
-v ~/config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z
```

## Tips for Success

1. **Start Simple**: Begin with the basic configuration
2. **Check Logs**: Use `podman logs -f rhdh` to see what's happening
3. **Test Incrementally**: Add one feature at a time
4. **Read the Docs**: Each directory has detailed README files
5. **Use Examples**: Start with provided examples before creating your own
6. **Ask for Help**: Review the troubleshooting sections
7. **Keep Learning**: RHDH is powerful - explore its features gradually

## What You've Accomplished

At this point, you have:

✅ Installed and configured RHDH locally  
✅ Accessed the RHDH UI  
✅ Registered example templates  
✅ Used a template to create an application  
✅ Built custom scaffolder actions  
✅ Understood the basic workflow  

## Learning Resources

- **Official Documentation:**
  - [Red Hat Developer Hub Docs](https://access.redhat.com/documentation/en-us/red_hat_developer_hub)
  - [Backstage Documentation](https://backstage.io/docs)
  - [Podman Documentation](https://docs.podman.io/)

- **This Repository:**
  - [Local Setup Guide](docs/local-setup-guide.md)
  - [Custom Scaffolder Actions](docs/custom-scaffolder-actions.md)
  - [Examples Directory](examples/)

- **Community:**
  - [Backstage Discord](https://discord.gg/backstage)
  - [Red Hat Developer Community](https://developers.redhat.com/)

## Getting Help

If you run into issues:

1. **Check the logs:**
   ```bash
   podman logs rhdh
   ```

2. **Review documentation:**
   - Start with [docs/local-setup-guide.md](docs/local-setup-guide.md)
   - Check the troubleshooting sections

3. **Verify prerequisites:**
   - Podman version
   - Available resources
   - File permissions

4. **Search for similar issues:**
   - GitHub issues
   - Backstage Discord
   - Community forums

## Next: Deep Dive

Ready to go deeper? Check out:

1. [**Local Setup Guide**](docs/local-setup-guide.md) - Comprehensive setup instructions
2. [**Custom Scaffolder Actions**](docs/custom-scaffolder-actions.md) - Build custom actions
3. [**Configuration Examples**](examples/config/README.md) - Advanced configurations
4. [**Template Examples**](examples/templates/README.md) - Template development

Happy scaffolding! 🚀
