#!/bin/bash
# Deploy script for building and uploading firmware
# The wsl enviroment is handled specially to manage file sharing between 
#    Windows and WSL due to the difficulty in accessing the serial port from WSL with platformio 
#   alone. A solution in this issue would allow wsl to manage the serial port directly:
# Ensure we're in the script's directory
cd "$(dirname "$0")"

# Load environment configuration
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ "$ENVIRONMENT_TYPE" == "wsl" ]; then
    echo "Pulling latest changes..."
    git pull

    echo "Detaching from WSL..."
    ./wslShare.sh off
fi

echo "Building and uploading firmware..."
pio run --target upload --environment tinyzero
EXIT_CODE=$?

if [ "$ENVIRONMENT_TYPE" == "wsl" ]; then
    echo "Attaching to WSL..."
    ./wslShare.sh on
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo "Upload successful!"
else
    echo "Upload failed."
    exit 1
fi
