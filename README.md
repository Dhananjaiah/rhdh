# Red Hat Developer Hub (RHDH) Local Development Guide

This repository contains comprehensive documentation and examples for setting up a local Red Hat Developer Hub (RHDH) development environment using Podman, along with guides for creating custom scaffolder actions.

## 📚 Documentation Structure

- **[Getting Started Guide](docs/getting-started.md)** - **START HERE!** Quick guide to get RHDH up and running
- **[Local Setup Guide](docs/local-setup-guide.md)** - Step-by-step instructions for installing and running RHDH locally with Podman
- **[Custom Scaffolder Actions](docs/custom-scaffolder-actions.md)** - Complete guide to creating custom scaffolder actions
- **[Examples](examples/)** - Working code examples and templates

## 🚀 Quick Start

**New to RHDH?** Start with the [Getting Started Guide](docs/getting-started.md) for a complete walkthrough!

### Prerequisites
- Podman installed and configured
- Basic knowledge of containers
- Node.js 18+ (for custom plugin development)
- Git

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/Dhananjaiah/rhdh.git
cd rhdh

# 2. Run RHDH with the helper script
cd examples/config
./run-rhdh.sh basic

# 3. Access RHDH at http://localhost:7007
```

That's it! For detailed instructions, see the [Getting Started Guide](docs/getting-started.md).

## 📖 What's Inside

### Local Setup Guide
Learn how to:
- Install prerequisites
- Configure Podman
- Run RHDH locally
- Configure app-config.yaml
- Set up authentication
- Troubleshoot common issues

### Custom Scaffolder Actions
Learn how to:
- Create a custom scaffolder action from scratch
- Trigger one template from another template
- Register and use custom actions
- Test your custom actions
- Package and deploy custom plugins

## 🔗 Useful Links

- [Red Hat Developer Hub Documentation](https://access.redhat.com/documentation/en-us/red_hat_developer_hub)
- [Backstage Documentation](https://backstage.io/docs/overview/what-is-backstage)
- [Podman Documentation](https://docs.podman.io/)

## 📝 License

This documentation is provided as-is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
