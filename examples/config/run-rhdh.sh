#!/bin/bash
#
# Script to run RHDH locally with Podman
# Usage: ./run-rhdh.sh [basic|advanced]

set -e

CONFIG_TYPE=${1:-basic}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/rhdh-config"

echo "==================================="
echo "RHDH Local Setup with Podman"
echo "==================================="
echo ""

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "Error: Podman is not installed"
    echo "Please install Podman first: https://podman.io/getting-started/installation"
    exit 1
fi

echo "✓ Podman is installed: $(podman --version)"
echo ""

# Create config directory
mkdir -p "$CONFIG_DIR"

# Copy appropriate config file
if [ "$CONFIG_TYPE" = "advanced" ]; then
    echo "Using advanced configuration with GitHub integration"
    CONFIG_FILE="app-config.advanced.yaml"
    
    # Check for .env file
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        echo "Warning: .env file not found"
        echo "Copy .env.example to .env and fill in your values"
        echo "For now, continuing with basic setup..."
        CONFIG_FILE="app-config.basic.yaml"
    fi
else
    echo "Using basic configuration"
    CONFIG_FILE="app-config.basic.yaml"
fi

# Copy config file
cp "$SCRIPT_DIR/$CONFIG_FILE" "$CONFIG_DIR/app-config.yaml"
echo "✓ Configuration copied to $CONFIG_DIR/app-config.yaml"
echo ""

# Pull RHDH image
echo "Pulling RHDH image..."
podman pull quay.io/rhdh/rhdh-hub-rhel9:latest
echo "✓ Image pulled successfully"
echo ""

# Stop and remove existing container
if podman ps -a | grep -q rhdh; then
    echo "Stopping existing RHDH container..."
    podman stop rhdh 2>/dev/null || true
    podman rm rhdh 2>/dev/null || true
fi

# Run RHDH container
echo "Starting RHDH container..."

if [ "$CONFIG_TYPE" = "advanced" ] && [ -f "$SCRIPT_DIR/.env" ]; then
    # Run with environment file
    podman run -d \
        --name rhdh \
        -p 7007:7007 \
        --env-file "$SCRIPT_DIR/.env" \
        -v "$CONFIG_DIR/app-config.yaml:/opt/app-root/src/app-config.yaml:Z" \
        -v "$SCRIPT_DIR/../templates:/opt/app-root/src/templates:Z" \
        quay.io/rhdh/rhdh-hub-rhel9:latest
else
    # Run with basic config
    podman run -d \
        --name rhdh \
        -p 7007:7007 \
        -v "$CONFIG_DIR/app-config.yaml:/opt/app-root/src/app-config.yaml:Z" \
        -v "$SCRIPT_DIR/../templates:/opt/app-root/src/templates:Z" \
        quay.io/rhdh/rhdh-hub-rhel9:latest
fi

echo "✓ RHDH container started"
echo ""

# Wait for RHDH to start
echo "Waiting for RHDH to start..."
for i in {1..30}; do
    if curl -s http://localhost:7007/healthcheck > /dev/null 2>&1; then
        echo "✓ RHDH is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Warning: RHDH did not start in 30 seconds"
        echo "Check logs with: podman logs rhdh"
    fi
    sleep 1
done

echo ""
echo "==================================="
echo "RHDH is running!"
echo "==================================="
echo ""
echo "Access RHDH at: http://localhost:7007"
echo ""
echo "Useful commands:"
echo "  View logs:    podman logs -f rhdh"
echo "  Stop RHDH:    podman stop rhdh"
echo "  Start RHDH:   podman start rhdh"
echo "  Remove RHDH:  podman rm rhdh"
echo ""
