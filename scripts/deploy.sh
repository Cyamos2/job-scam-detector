#!/bin/bash
# Deploy server using Docker Compose
set -e

docker-compose up --build -d

echo "Server deployed and running at http://localhost:3000"