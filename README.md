# Dragons Flame

> **Note**: Dragons Flame is a fork of the original [Flame](https://github.com/pawelmalak/flame) project by Pawel Malak and contributors. We extend our gratitude to all the original contributors who made this project possible.

![Homescreen screenshot](.github/home.png)

## Description

Dragons Flame is a self-hosted startpage for your server, forked from the original Flame project. Its design is inspired (heavily) by [SUI](https://github.com/jeroenpardon/sui). Dragons Flame is very easy to setup and use. With built-in editors, it allows you to setup your very own application hub in no time - no file editing necessary.

## Functionality
- 📝 Create, update, delete your applications and bookmarks directly from the app using built-in GUI editors
- 📌 Pin your favourite items to the homescreen for quick and easy access
- 🔍 Integrated search bar with local filtering, 11 web search providers and ability to add your own
- 🔑 Authentication system to protect your settings, apps and bookmarks
- 🔨 Dozens of options to customize Dragons Flame interface to your needs, including support for custom CSS, 15 built-in color themes and custom theme builder
- ☀️ Weather widget with current temperature, cloud coverage and animated weather status
- 🐳 Docker integration to automatically pick and add apps based on their labels
- 📁 **Import/Export functionality** - Complete data management and migration tools

## Installation

### With Docker (recommended)

[Docker Hub link](https://hub.docker.com/r/kwslavens74/dragons-flame)

```sh
docker pull kwslavens74/dragons-flame

# for ARM architecture (e.g. RaspberryPi)
docker pull kwslavens74/dragons-flame:multiarch

# installing specific version
docker pull kwslavens74/dragons-flame:2.4.0
```

#### Deployment

```sh
# run container
docker run -p 5005:5005 -v /path/to/data:/app/data -e PASSWORD=dragons_flame_password kwslavens74/dragons-flame
```

#### Building images

```sh
# build image for amd64 only
docker build -t dragons-flame -f .docker/Dockerfile .

# build multiarch image for amd64, armv7 and arm64
# building failed multiple times with 2GB memory usage limit so you might want to increase it
docker buildx build \
  --platform linux/arm/v7,linux/arm64,linux/amd64 \
  -f .docker/Dockerfile.multiarch \
  -t dragons-flame:multiarch .
```

#### Docker-Compose

```yaml
version: '3.6'

services:
  dragons-flame:
    image: kwslavens74/dragons-flame
    container_name: dragons-flame
    volumes:
      - /path/to/host/data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock # optional but required for Docker integration
    ports:
      - 5005:5005
    secrets:
      - password # optional but required for (1)
    environment:
      - PASSWORD=dragons_flame_password
      - PASSWORD_FILE=/run/secrets/password # optional but required for (1)
    restart: unless-stopped

# optional but required for Docker secrets (1)
secrets:
  password:
    file: /path/to/secrets/password
```

##### Docker Secrets

All environment variables can be overwritten by appending `_FILE` to the variable value. For example, you can use `PASSWORD_FILE` to pass through a docker secret instead of `PASSWORD`. If both `PASSWORD` and `PASSWORD_FILE` are set, the docker secret will take precedent.

```bash
# ./secrets/dragons_flame_password
my_custom_secret_password_123

# ./docker-compose.yml
secrets:
  password:
    file: ./secrets/dragons_flame_password
```

#### Skaffold

```sh
# use skaffold
skaffold dev
```

### Without Docker

Follow instructions from the original Flame wiki: [Installation without Docker](https://github.com/pawelmalak/flame/wiki/Installation-without-docker)

## Development

### Technology

- Backend
  - Node.js + Express
  - Sequelize ORM + SQLite
- Frontend
  - React
  - Redux
  - TypeScript
- Deployment
  - Docker
  - Kubernetes

### Creating dev environment

```sh
# clone repository
git clone https://github.com/kwslavens74/dragons-flame
cd dragons-flame

# run only once
npm run dev-init

# start backend and frontend development servers
npm run dev
```

## Screenshots

![Apps screenshot](.github/apps.png)

![Bookmarks screenshot](.github/bookmarks.png)

![Settings screenshot](.github/settings.png)

![Themes screenshot](.github/themes.png)

## Usage

### Authentication

Visit the original [Flame project wiki](https://github.com/pawelmalak/flame/wiki/Authentication) to read more about authentication

### Search bar

#### Searching

The default search setting is to search through all your apps and bookmarks. If you want to search using specific search engine, you need to type your search query with selected prefix. For example, to search for "what is docker" using google search you would type: `/g what is docker`.

For list of supported search engines, shortcuts and more about searching functionality visit the original [Flame project wiki](https://github.com/pawelmalak/flame/wiki/Search-bar).

### Setting up weather module

1. Obtain API Key from [Weather API](https://www.weatherapi.com/pricing.aspx).
   > Free plan allows for 1M calls per month. Dragons Flame is making less then 3K API calls per month.
2. Get lat/long for your location. You can get them from [latlong.net](https://www.latlong.net/convert-address-to-lat-long.html).
3. Enter and save data. Weather widget will now update and should be visible on Home page.

### Docker integration

In order to use the Docker integration, each container must have the following labels:

```yml
labels:
  - flame.type=application # "app" works too
  - flame.name=My container
  - flame.url=https://example.com
  - flame.icon=icon-name # optional, default is "docker"
# - flame.icon=custom to make changes in app. ie: custom icon upload
```

> "Use Docker API" option must be enabled for this to work. You can find it in Settings > Docker

You can also set up different apps in the same label adding `;` between each one.

```yml
labels:
  - flame.type=application
  - flame.name=First App;Second App
  - flame.url=https://example1.com;https://example2.com
  - flame.icon=icon-name1;icon-name2
```

If you want to use a remote docker host follow this instructions in the host:

- Open the file `/lib/systemd/system/docker.service`, search for `ExecStart` and edit the value

```text
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:${PORT} -H unix:///var/run/docker.sock
```

>The above command will bind the docker engine server to the Unix socket as well as TCP port of your choice. “0.0.0.0” means docker-engine accepts connections from all IP addresses.

- Restart the daemon and Docker service

```shell
sudo systemctl daemon-reload
sudo service docker restart
```

- Test if it is working

```shell
curl http://${IP}:${PORT}/version
```

### Kubernetes integration

In order to use the Kubernetes integration, each ingress must have the following annotations:

```yml
metadata:
  annotations:
  - flame.pawelmalak/type=application # "app" works too
  - flame.pawelmalak/name=My container
  - flame.pawelmalak/url=https://example.com
  - flame.pawelmalak/icon=icon-name # optional, default is "kubernetes"
```

> "Use Kubernetes Ingress API" option must be enabled for this to work. You can find it in Settings > Docker

### Import/Export Data Management

Dragons Flame v2.4.0 introduces comprehensive data management capabilities for backup, restore, and migration operations.

#### Web Interface Import/Export

Access the import/export functionality through the web interface at `Settings > Data Management`:

**Export Options:**
- 📤 **Full Export**: Export all Dragons Flame data (apps, bookmarks, categories, settings) to JSON format
- 📤 **Selective Export**: Choose specific data types to export
- 📤 **Backup Export**: Create complete backups for disaster recovery

**Import Options:**
- 📥 **HTML Bookmarks Import**: Import bookmarks from browser exports (Chrome, Firefox, Safari, etc.)
- 📥 **JSON Import**: Import data from Dragons Flame JSON exports
- 📥 **Bulk Import**: Import multiple files or large datasets
- 📥 **Migration Import**: Move data between Dragons Flame instances

**Features:**
- ✅ **Data Validation**: Automatic validation of imported data
- ✅ **Error Handling**: Detailed error reports and rollback capabilities
- ✅ **Duplicate Detection**: Smart handling of duplicate entries
- ✅ **Category Management**: Automatic category creation and mapping
- ✅ **Preview Mode**: Preview imports before applying changes

#### Command Line Import (Legacy)

For advanced users, the Python-based HTML bookmark importer is still available:

- Requirements: `python3`, `Pillow`, `beautifulsoup4`
- **Important**: Always backup your `db.sqlite` before running!

```bash
pip3 install Pillow beautifulsoup4

cd dragons-flame/.dev
python3 bookmarks_importer.py --bookmarks <path to bookmarks.html> --data <path to dragons flame data folder>
```

#### Migration Between Instances

To migrate from one Dragons Flame instance to another:

1. **Source Instance**: Go to Settings > Data Management > Export > Full Export
2. **Download** the generated JSON file
3. **Target Instance**: Go to Settings > Data Management > Import > JSON Import
4. **Upload** the JSON file and follow the import wizard

#### Backup Strategy Recommendations

- 🔄 **Regular Exports**: Schedule regular full exports for backup
- 💾 **Multiple Locations**: Store backups in multiple locations
- 🧪 **Test Restores**: Periodically test your backup restoration process
- 📝 **Documentation**: Keep notes about your backup procedures

### Custom CSS and themes

See the original Flame project wiki for [Custom CSS](https://github.com/pawelmalak/flame/wiki/Custom-CSS) and [Custom theme with CSS](https://github.com/pawelmalak/flame/wiki/Custom-theme-with-CSS).
