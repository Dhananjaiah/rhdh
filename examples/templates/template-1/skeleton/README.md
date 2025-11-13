# ${{ values.name }}

${{ values.description }}

## Overview

This application was created using the RHDH Scaffolder Main Application Template.

## Features

- Modern Node.js application structure
- Ready for containerization
- Pre-configured for RHDH catalog integration

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## Project Structure

```
.
├── src/
│   ├── index.ts        # Application entry point
│   └── ...
├── tests/
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t ${{ values.name }}:latest .

# Run container
docker run -p 3000:3000 ${{ values.name }}:latest
```

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## CI/CD

This project is configured for continuous integration and deployment.

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Copyright © 2024. All rights reserved.

## Support

For support, please contact the platform team or open an issue in the repository.
