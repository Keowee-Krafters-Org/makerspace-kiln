#
# Attach or detacth WSL shared USB port using the usbipd service
# Usage: wslShare.sh [on|off|list] [busid]
# Mounts or unmounts the shared USB drive in WSL
#

#!/bin/bash

# List the available USB devices with:
#   usbipd list
# Then extract the busid of the desired device to share.

# Search for devices (case-insensitive) to find Arduino or USB-Serial
export USB_DEVICES=$(usbipd list | grep -iE "USB|Arduino")

if [ "$1" == "detach-all" ]; then
    echo "Checking for attached devices..."
    # Find all busids with state 'Attached'
    ATTACHED_IDS=$(usbipd list | grep "Attached" | awk '{print $1}')
    
    if [ -z "$ATTACHED_IDS" ]; then
        echo "No attached devices found."
    else
        for id in $ATTACHED_IDS; do
            echo "Detaching busid: $id"
            usbipd detach --busid "$id"
        done
    fi
    exit 0
fi

# Extract the busid of the first relevant device found
USB_BUSID=$(echo "$USB_DEVICES" | head -n 1 | awk '{print $1}')

# use the optional PORT argument if provided or a default value
PORT=${2:-$USB_BUSID}
echo "Using busid: $PORT"
if [ "$1" == "on" ]; then
    # try the bind command first to ensure the device is available
    usbipd bind --busid $PORT
    usbipd attach --wsl --busid $PORT
    echo "WSL USB sharing enabled."
elif [ "$1" == "off" ]; then
    if [ -n "$PORT" ]; then
        usbipd detach --busid $PORT
        echo "WSL USB sharing disabled for $PORT."
    else
        echo "No device found to detach."
    fi
elif [ "$1" == "list" ]; then
    usbipd list
else
    echo "Usage: wslShare.sh [on|off|list|detach-all] [busid]"
    exit 1
fi