# Piano Chord Learning App

An interactive web application for learning piano chords and scales. Built with React, TypeScript, and Tone.js.

## Features

- Interactive piano keyboard with realistic sound
- Learn common piano chords and scales
- Visual feedback on the keyboard
- Responsive design that works on both desktop and mobile devices
- Timeline sequencer for creating and playing chord progressions

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Deploying to GitHub Pages

### Step 1: Update homepage URL

In `package.json`, replace the placeholder in the homepage field with your actual GitHub username:

```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/piano-app",
```

### Step 2: Create GitHub repository

1. Create a new repository on GitHub named `piano-app`
2. Initialize Git in your local project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Add the remote repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/piano-app.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy to GitHub Pages

Run the deployment command:
```bash
npm run deploy
```

This will build the application and publish it to GitHub Pages. The deployment process:
1. Cleans the dist directory
2. Builds the app with proper base URL
3. Publishes the contents to the gh-pages branch

### Step 4: Access your deployed app

After deployment completes, your app should be available at:
`https://YOUR_GITHUB_USERNAME.github.io/piano-app`

## Troubleshooting Deployment

If you encounter issues during deployment:

1. Ensure you have the correct permissions for the GitHub repository
2. Check that the gh-pages branch was created successfully
3. Verify GitHub Pages is enabled in your repository settings
4. It may take a few minutes for changes to propagate after deployment

## License

ISC 