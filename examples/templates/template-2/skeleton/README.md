# ${{ values.name }}

${{ values.description }}

{% if values.parentApp %}
**Parent Application:** ${{ values.parentApp }}
{% endif %}

## Overview

This service was created using the RHDH Scaffolder Dependent Service Template.
{% if values.parentApp %}
It is designed to work as a dependent microservice for the ${{ values.parentApp }} application.
{% endif %}

## Features

- Microservice architecture
- RESTful API
- Docker ready
- Kubernetes ready
- Integration with RHDH catalog

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

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the service.

### Service Info

```
GET /info
```

Returns information about the service.

## Project Structure

```
.
├── src/
│   ├── index.ts        # Application entry point
│   ├── routes/         # API routes
│   └── services/       # Business logic
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
docker run -p 8080:8080 ${{ values.name }}:latest
```

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## Configuration

Environment variables:

- `PORT` - Port to run the service on (default: 8080)
- `LOG_LEVEL` - Logging level (default: info)
{% if values.parentApp %}
- `PARENT_APP_URL` - URL of the parent application
{% endif %}

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## CI/CD

This project is configured for continuous integration and deployment.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

Copyright © 2024. All rights reserved.

## Support

For support, please contact the platform team or open an issue in the repository.
