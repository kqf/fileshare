#!/bin/sh
set -e

python3 -u /app/alert.py &

# Wait until port is open
until nc -z 127.0.0.1 3001; do
  sleep 0.2
done

nginx -g 'daemon off;'
