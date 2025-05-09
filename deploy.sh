#!/bin/bash

# Exit if any command fails
set -e

# Display steps as they're executed
set -x

# Set Git configuration if needed
git config --global user.name "Your Name" || true
git config --global user.email "your.email@example.com" || true

# Install dependencies
npm install

# Build and deploy the application
npm run predeploy
npm run deploy

echo "Deployment completed successfully!" 