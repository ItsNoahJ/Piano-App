# Piano App - GitHub Pages Deployment Guide

This guide walks through deploying your Piano App to GitHub Pages.

## Prerequisites

1. A GitHub account
2. Git installed on your local machine
3. Node.js and npm installed on your local machine

## Setup Steps

### 1. Update the homepage

In `package.json`, change the `homepage` property to match your GitHub username:

```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/piano-app"
```

### 2. Create a GitHub repository

1. Go to GitHub.com and log in
2. Click "New repository" button
3. Name your repository `piano-app`
4. Choose "Public" for the repository visibility
5. Click "Create repository"

### 3. Push your code to GitHub

If your project isn't already connected to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/piano-app.git
git push -u origin main
```

### 4. Deploy the app

Option 1: Using the provided script:
```bash
# Make the script executable
chmod +x deploy.sh

# Run the script
./deploy.sh
```

Option 2: Manually with npm commands:
```bash
# Install dependencies
npm install

# Deploy to GitHub Pages
npm run deploy
```

### 5. Configure GitHub Pages settings

1. Go to your GitHub repository settings
2. Scroll down to the "GitHub Pages" section
3. Check that the source is set to `gh-pages` branch
4. Wait a few minutes for the deployment to complete
5. Your app will be accessible at: `https://YOUR_GITHUB_USERNAME.github.io/piano-app`

## Deployment Troubleshooting

If your deployment encounters issues:

1. **404 errors**: Make sure `homepage` in package.json is correctly set
2. **Missing assets**: Check that `--public-url ./` is included in the build script
3. **Blank page**: Open browser console to check for errors; might be a path issue

## Updating Your Deployed App

When you make changes to your app, redeploy it with:

```bash
npm run deploy
```

This builds your app and pushes the changes to the `gh-pages` branch automatically. 