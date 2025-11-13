# RHDH Examples

This directory contains working examples for Red Hat Developer Hub (RHDH), including configuration files, custom scaffolder actions, and template examples.

## 📁 Directory Structure

```
examples/
├── config/                    # Configuration examples
│   ├── app-config.basic.yaml
│   ├── app-config.advanced.yaml
│   ├── .env.example
│   ├── run-rhdh.sh
│   └── README.md
├── custom-actions/            # Custom scaffolder actions
│   ├── src/
│   │   ├── actions/
│   │   │   ├── triggerTemplate.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── templates/                 # Template examples
    ├── template-1/           # Main application template
    │   ├── template.yaml
    │   └── skeleton/
    ├── template-2/           # Dependent service template
    │   ├── template.yaml
    │   └── skeleton/
    └── README.md
```

## 🚀 Quick Start

### 1. Run RHDH Locally

```bash
cd config
./run-rhdh.sh basic
```

This will:
- Pull the RHDH image
- Start RHDH with basic configuration
- Mount example templates
- Make RHDH available at http://localhost:7007

### 2. Build Custom Actions

```bash
cd custom-actions
yarn install
yarn build
```

### 3. Use Templates

1. Access RHDH at http://localhost:7007
2. Navigate to "Create"
3. Select "Main Application Template"
4. Fill in the form and submit

## 📚 What's Included

### Configuration Examples

Three types of configurations for different use cases:

1. **Basic Configuration** (`app-config.basic.yaml`)
   - In-memory database
   - Guest authentication
   - Quick setup for learning

2. **Advanced Configuration** (`app-config.advanced.yaml`)
   - PostgreSQL database
   - GitHub integration
   - OAuth authentication
   - Production-like setup

3. **Helper Script** (`run-rhdh.sh`)
   - Automated setup
   - Configuration selection
   - Container management

See [config/README.md](config/README.md) for details.

### Custom Scaffolder Actions

A complete implementation of custom scaffolder actions:

1. **Trigger Template Action** (`trigger:template`)
   - Trigger one template from another
   - Pass values between templates
   - Wait for completion or async execution
   - Full TypeScript implementation

See [custom-actions/README.md](custom-actions/README.md) for details.

### Template Examples

Two working templates demonstrating the trigger action:

1. **Template 1: Main Application**
   - Creates a Node.js application
   - Optionally triggers Template 2
   - Demonstrates template chaining

2. **Template 2: Dependent Service**
   - Creates a microservice
   - Can be triggered from Template 1
   - Shows parent-child relationships

See [templates/README.md](templates/README.md) for details.

## 🎯 Common Use Cases

### Use Case 1: Quick Local Setup

**Goal:** Get RHDH running locally as fast as possible

```bash
# 1. Run RHDH
cd examples/config
./run-rhdh.sh basic

# 2. Access at http://localhost:7007
```

### Use Case 2: Test Custom Actions

**Goal:** Test the custom trigger template action

```bash
# 1. Build custom actions
cd examples/custom-actions
yarn install && yarn build

# 2. Run RHDH with custom actions
cd ../config
./run-rhdh.sh basic

# 3. Mount custom actions (modify run-rhdh.sh or run manually)
# 4. Use Template 1 to trigger Template 2
```

### Use Case 3: GitHub Integration

**Goal:** Connect RHDH to GitHub repositories

```bash
# 1. Set up environment
cd examples/config
cp .env.example .env
# Edit .env with your GitHub token

# 2. Run with advanced config
./run-rhdh.sh advanced

# 3. RHDH will automatically discover GitHub repositories
```

### Use Case 4: Create Multi-Service Application

**Goal:** Create an application with dependent services

1. Access RHDH at http://localhost:7007
2. Go to "Create" → "Main Application Template"
3. Fill in application details
4. Check "Create Dependent Service"
5. Submit
6. Watch as Template 1 creates the app and triggers Template 2

## 🔧 Customization

### Modify Configurations

1. Copy a config file:
   ```bash
   cp examples/config/app-config.basic.yaml my-config.yaml
   ```

2. Edit as needed:
   ```yaml
   app:
     title: My Custom RHDH
   ```

3. Use with Podman:
   ```bash
   podman run -d \
     --name rhdh \
     -p 7007:7007 \
     -v ./my-config.yaml:/opt/app-root/src/app-config.yaml:Z \
     quay.io/rhdh/rhdh-hub-rhel9:latest
   ```

### Create Custom Actions

1. Add a new action file:
   ```bash
   cd examples/custom-actions/src/actions
   touch myAction.ts
   ```

2. Implement the action:
   ```typescript
   import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
   
   export function createMyAction() {
     return createTemplateAction({
       id: 'my:action',
       // ... implementation
     });
   }
   ```

3. Export from `index.ts`:
   ```typescript
   export { createMyAction } from './myAction';
   ```

4. Register in `getCustomActions`:
   ```typescript
   return [
     createTriggerTemplateAction(options),
     createMyAction(options),
   ];
   ```

### Create Custom Templates

1. Copy an existing template:
   ```bash
   cp -r examples/templates/template-1 examples/templates/my-template
   ```

2. Edit `template.yaml`:
   ```yaml
   metadata:
     name: my-custom-template
     title: My Custom Template
   ```

3. Customize skeleton files

4. Register in RHDH

## 🧪 Testing

### Test Configurations

```bash
# Test basic config
cd examples/config
./run-rhdh.sh basic
curl http://localhost:7007/healthcheck

# Test advanced config (requires .env)
./run-rhdh.sh advanced
curl http://localhost:7007/api/catalog/entities
```

### Test Custom Actions

```bash
# Build and test
cd examples/custom-actions
yarn build
# Add tests if desired
yarn test
```

### Test Templates

```bash
# Validate YAML
yamllint examples/templates/template-1/template.yaml

# Test in RHDH
# 1. Register template in catalog
# 2. Use it to create a project
# 3. Check logs for errors
```

## 📖 Documentation

- [Main README](../README.md) - Project overview
- [Local Setup Guide](../docs/local-setup-guide.md) - Complete setup instructions
- [Custom Scaffolder Actions](../docs/custom-scaffolder-actions.md) - Action development guide
- [Configuration README](config/README.md) - Configuration details
- [Custom Actions README](custom-actions/README.md) - Action implementation
- [Templates README](templates/README.md) - Template usage

## 🐛 Troubleshooting

### RHDH Won't Start

```bash
# Check logs
podman logs rhdh

# Common fixes:
# - Ensure port 7007 is free
# - Check config file syntax
# - Verify Podman is running
```

### Templates Not Showing

```bash
# Check catalog logs
podman logs rhdh | grep catalog

# Verify template registration
curl http://localhost:7007/api/catalog/entities?filter=kind=Template
```

### Custom Actions Not Working

```bash
# Ensure actions are built
cd examples/custom-actions
yarn build

# Check if mounted in container
podman exec rhdh ls -la /opt/app-root/src/custom-actions
```

### GitHub Integration Issues

```bash
# Verify token
echo $GITHUB_TOKEN

# Test token
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Check RHDH logs
podman logs rhdh | grep github
```

## 💡 Tips

1. **Start Simple**: Use basic config first, then advance
2. **Check Logs**: Always review logs when troubleshooting
3. **Validate YAML**: Use yamllint before registering templates
4. **Test Locally**: Test templates before production
5. **Version Control**: Keep configs and templates in Git
6. **Document Changes**: Add comments to custom configs
7. **Use Variables**: Leverage environment variables for secrets
8. **Backup Often**: Back up your configurations

## 🔗 Additional Resources

- [Red Hat Developer Hub Documentation](https://access.redhat.com/documentation/en-us/red_hat_developer_hub)
- [Backstage Documentation](https://backstage.io/docs)
- [Podman Documentation](https://docs.podman.io/)
- [Backstage Software Templates](https://backstage.io/docs/features/software-templates/)

## 🤝 Contributing

To contribute examples:

1. Create your example in the appropriate directory
2. Follow existing patterns and structure
3. Document thoroughly with README
4. Test with multiple scenarios
5. Submit a pull request

## 📝 License

These examples are provided as-is for educational purposes.

## ⚙️ System Requirements

- **Podman**: 4.0+
- **Node.js**: 18+ (for custom actions)
- **Memory**: 4GB minimum
- **Disk**: 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2
