#!/bin/bash
set -e

# --- Config ---
TARGET_DIR="/opt/makerspace-kiln"
PACKAGE_NAME="kiln-release.tar.gz"
# Get the home directory of the user who invoked sudo
if [ -n "$SUDO_USER" ]; then
    USER_HOME=$(getent passwd "$SUDO_USER" | cut -d: -f6)
else
    USER_HOME=$HOME
fi

echo "--- Starting Kiln Installation ---"

# 1. Backup existing installation
if [ -d "$TARGET_DIR" ]; then
    BACKUP_DIR="${TARGET_DIR}-backup-$(date +%Y%m%d%H%M%S)"
    echo "Backing up existing installation to $BACKUP_DIR"
    sudo mv "$TARGET_DIR" "$BACKUP_DIR"
fi

# 2. Create fresh directory
echo "Creating new installation directory at $TARGET_DIR"
sudo mkdir -p "$TARGET_DIR"
sudo chown -R $SUDO_USER:$SUDO_USER "$TARGET_DIR"

# 3. Extract new package
echo "Extracting $USER_HOME/$PACKAGE_NAME to $TARGET_DIR"
sudo -u $SUDO_USER tar -xzf "$USER_HOME/$PACKAGE_NAME" -C "$TARGET_DIR"

# 4. Install Dependencies
echo "Installing production dependencies..."
cd "$TARGET_DIR"
sudo -u $SUDO_USER npm install --omit=dev

# 5. Initialize Config
CONFIG_PATH="/var/lib/kiln-controller/config.json"
if [ ! -f "$CONFIG_PATH" ]; then
    echo "Initializing default configuration at $CONFIG_PATH..."
    sudo mkdir -p /var/lib/kiln-controller
    sudo cp "$TARGET_DIR/config.json" "$CONFIG_PATH"
    sudo chown $SUDO_USER:$SUDO_USER "$CONFIG_PATH"
else
    echo "Configuration file already exists. Skipping initialization."
fi

# 6. Setup systemd service
echo "Setting up systemd service..."
sudo cp "$TARGET_DIR/kiln-controller.service" /etc/systemd/system/kiln-controller.service
sudo systemctl daemon-reload

# 7. Restart Service
echo "Restarting kiln-controller service..."
sudo systemctl restart kiln-controller

echo "--- Installation Complete ---"

