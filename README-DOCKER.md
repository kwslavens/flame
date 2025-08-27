# 🔥 Flame with Import/Export - Docker Deployment Guide

This is a fork of [Flame](https://github.com/pawelmalak/flame) with added import/export functionality for backup and migration purposes.

## ✨ New Features

- **📤 Export Data**: Complete JSON backup or browser-compatible HTML bookmarks
- **📥 Import Data**: Restore from Flame backups or import browser bookmarks
- **🔄 Migration Tools**: Easy data transfer between Flame instances
- **🛡️ Safe Operations**: Transaction-based imports with duplicate handling

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone this repository
git clone https://github.com/your-username/flame
cd flame

# Start with Docker Compose
docker-compose up -d

# Access Flame at http://localhost:5005
# Import/Export at http://localhost:5005/settings/data
```

### Using Pre-built Image

```bash
# Pull and run the image
docker run -d \
  --name flame \
  -p 5005:5005 \
  -v flame_data:/app/data \
  -e PASSWORD=your_password \
  your-username/flame-import-export:latest
```

### Building Your Own Image

```bash
# Build locally
./build-docker.sh

# Or build multi-architecture (requires buildx)
./build-multiarch.sh
```

## 📋 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PASSWORD` | `flame_password` | Admin password for protected routes |
| `NODE_ENV` | `production` | Node.js environment |

### Docker Compose Configuration

```yaml
version: '3.6'
services:
  flame:
    image: your-username/flame-import-export:latest
    container_name: flame
    volumes:
      - flame_data:/app/data
      # Optional: Docker integration
      # - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "5005:5005"
    environment:
      - PASSWORD=your_secure_password
    restart: unless-stopped

volumes:
  flame_data:
```

## 🔧 Building From Source

### Prerequisites

- Docker (with buildx for multi-arch)
- Node.js 16+ (for development)

### Build Process

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/flame
   cd flame
   ```

2. **Build single architecture**:
   ```bash
   chmod +x build-docker.sh
   ./build-docker.sh [optional-tag]
   ```

3. **Build multi-architecture**:
   ```bash
   chmod +x build-multiarch.sh
   ./build-multiarch.sh [optional-tag]
   ```

### Build Scripts

- `build-docker.sh`: Builds for current architecture, optional registry push
- `build-multiarch.sh`: Builds for AMD64, ARM64, and ARMv7, pushes to registry
- `docker-compose.yml`: Local development and deployment

## 📊 Import/Export Features

### Export Options

1. **JSON Export** (`/api/export/json`):
   - Complete Flame backup
   - Includes all metadata (apps, bookmarks, categories, settings)
   - Perfect for Flame-to-Flame migrations

2. **HTML Export** (`/api/export/html`):
   - Browser-compatible bookmark format
   - Can be imported into Chrome, Firefox, Safari
   - Organized by categories as folders

### Import Options

1. **JSON Import** (`/api/import`):
   - Restore from Flame JSON backups
   - Selective import (apps, bookmarks, categories)
   - Duplicate handling options
   - Safe merge or complete replacement

2. **HTML Import** (`/api/import`):
   - Import browser bookmark files
   - Automatic folder-to-category mapping
   - Preserves bookmark organization

### Import/Export UI

Navigate to **Settings → Data** in your Flame interface to access:

- Export buttons for both formats
- File upload for imports
- Configuration options (skip duplicates, clear existing data, etc.)
- Real-time import progress and results
- Detailed error reporting

## 🔒 Security Notes

- Import/Export endpoints require authentication
- All operations use database transactions for data integrity
- File uploads are processed in-memory (no temporary files)
- Sensitive data is not logged or exposed

## 🐛 Troubleshooting

### Common Issues

1. **Build fails on ARM devices**:
   ```bash
   # Use the multiarch image instead
   docker pull your-username/flame-import-export:multiarch-latest
   ```

2. **Import fails with large files**:
   - Check Docker memory limits
   - Ensure file format is correct (UTF-8 encoding)

3. **Permissions errors**:
   ```bash
   # Fix data directory permissions
   docker exec flame chown -R flame:nodejs /app/data
   ```

### Logs

```bash
# View container logs
docker logs flame

# Follow logs in real-time
docker logs -f flame
```

## 📝 License

Same as original Flame project - ISC License

## 🤝 Contributing

This is a personal fork. For the original project, visit [pawelmalak/flame](https://github.com/pawelmalak/flame).

## 🔗 Links

- **Original Flame**: https://github.com/pawelmalak/flame
- **Docker Hub**: https://hub.docker.com/r/your-username/flame-import-export
- **Demo**: http://localhost:5005 (after deployment)