#!/bin/bash

# Build script for Flame with Import/Export functionality
# Usage: ./build-docker.sh [tag]

set -e

# Configuration
IMAGE_NAME="flame-import-export"
REGISTRY_NAME="kwslavens74"  # Change this to your Docker Hub username
VERSION=$(node -p "require('./package.json').version")
TAG=${1:-$VERSION}

echo "🔥 Building Flame with Import/Export functionality"
echo "📦 Version: $VERSION"
echo "🏷️  Tag: $TAG"
echo ""

# Build the Docker image
echo "🔨 Building Docker image..."
docker build \
  -t $IMAGE_NAME:latest \
  -t $IMAGE_NAME:$TAG \
  -f Dockerfile \
  .

echo ""
echo "✅ Docker image built successfully!"
echo "🏷️  Tagged as:"
echo "   - $IMAGE_NAME:latest"
echo "   - $IMAGE_NAME:$TAG"
echo ""

# Optional: Push to registry
read -p "📤 Do you want to push to Docker registry? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to Docker registry..."
    
    # Tag with registry name
    docker tag $IMAGE_NAME:latest $REGISTRY_NAME/$IMAGE_NAME:latest
    docker tag $IMAGE_NAME:$TAG $REGISTRY_NAME/$IMAGE_NAME:$TAG
    
    # Push to registry
    docker push $REGISTRY_NAME/$IMAGE_NAME:latest
    docker push $REGISTRY_NAME/$IMAGE_NAME:$TAG
    
    echo "✅ Successfully pushed to registry!"
    echo "🌐 Available at:"
    echo "   - $REGISTRY_NAME/$IMAGE_NAME:latest"
    echo "   - $REGISTRY_NAME/$IMAGE_NAME:$TAG"
else
    echo "ℹ️  Skipping registry push"
fi

echo ""
echo "🚀 Ready to deploy! Use one of these commands:"
echo ""
echo "📦 Using Docker Compose (recommended):"
echo "   docker-compose up -d"
echo ""
echo "🐳 Using Docker directly:"
echo "   docker run -d -p 5005:5005 -v flame_data:/app/data --name flame $IMAGE_NAME:$TAG"
echo ""
echo "🌐 Access your Flame instance at: http://localhost:5005"
echo "📊 Import/Export available at: http://localhost:5005/settings/data"