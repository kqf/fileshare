#!/bin/sh
set -e

python3 /app/alert.py & nginx -g 'daemon off;'
