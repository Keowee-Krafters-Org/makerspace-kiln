#
# Attach or detacth WSL shared USB port using the usbipd service
# Usage: wslShare.sh [on|off|list] [busid]
# Mounts or unmounts the shared USB drive in WSL
#

#!/bin/bash

# List the available USB devices with:
#   usbipd list
# Then extract the busid of the desired device to share.

if [ "$1" == "on" ]; then
    # Wait for device to enumerate (addressing race condition after upload)
    echo "Waiting for device to appear..."
    for i in {1..10}; do
        # Refresh listing
        USB_DEVICES=$(usbipd list | grep -iE "USB|Arduino")
        
        # Try to find a valid BusID (digits-digits) to avoid matching UUIDs/Hubs if the device isn't ready
        # We look for lines starting with a standard BusID pattern (e.g., 1-1)
        USB_BUSID=$(echo "$USB_DEVICES" | grep -E "^[0-9]+-[0-9]+" | head -n 1 | awk '{print $1}')
        
        if [ -n "$USB_BUSID" ]; then
            break
        fi
        sleep 1
    done

    if [ -z "$USB_BUSID" ]; then
        echo "Error: Could not find relevant USB/Arduino device after waiting."
        usbipd list
        exit 1
    fi

    # use the optional PORT argument if provided or a default value
    PORT=${2:-$USB_BUSID}
    echo "Using busid: $PORT"

    # try the bind command first to ensure the device is available
    usbipd bind --busid $PORT
    usbipd attach --wsl --busid $PORT
    echo "WSL USB sharing enabled."
elif [ "$1" == "off" ]; then
    # For off command, we can just grab what's there currently
    USB_DEVICES=$(usbipd list | grep -iE "USB|Arduino")
    USB_BUSID=$(echo "$USB_DEVICES" | head -n 1 | awk '{print $1}')
    PORT=${2:-$USB_BUSID}

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