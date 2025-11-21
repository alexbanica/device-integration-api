#!/bin/sh
set -e

# Start pigpio daemon if it exists (required for GPIO interactions)
if [ -x "/usr/bin/pigpiod" ]; then
    echo "Starting pigpiod daemon..."
    sleep 1
    /usr/bin/pigpiod
    
    # Optional: wait a moment to ensure the daemon is ready
    sleep 1
fi

# Execute the command passed to docker run (defaults to CMD: npm start)
exec su-exec node "$@"