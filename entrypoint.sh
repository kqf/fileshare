#!/bin/sh
set -e

python3 /app/alert.py &
touch /var/log/nginx/access.log &
tail -f /var/log/nginx/access.log &
nginx -g 'daemon off;'
