#!/bin/bash
# Local setup script for development
set -e

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

echo "Setup complete!"
