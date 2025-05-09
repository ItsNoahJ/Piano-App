const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check if homepage is set correctly
const homepage = packageJson.homepage;
const placeholderDetected = homepage.includes('YOUR_GITHUB_USERNAME');

if (placeholderDetected) {
  console.log('\x1b[33m%s\x1b[0m', 'Warning: GitHub username placeholder detected in package.json');
  
  rl.question('Enter your GitHub username: ', (username) => {
    if (!username) {
      console.log('\x1b[31m%s\x1b[0m', 'Error: GitHub username is required for deployment');
      rl.close();
      process.exit(1);
    }
    
    // Update package.json with the real username
    const newHomepage = homepage.replace('YOUR_GITHUB_USERNAME', username);
    packageJson.homepage = newHomepage;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('\x1b[32m%s\x1b[0m', `Updated homepage URL to: ${newHomepage}`);
    
    deployToGitHubPages();
    rl.close();
  });
} else {
  deployToGitHubPages();
  rl.close();
}

function deployToGitHubPages() {
  try {
    console.log('\x1b[36m%s\x1b[0m', 'Starting deployment to GitHub Pages...');
    
    // Run the deploy script
    execSync('npm run deploy', { stdio: 'inherit' });
    
    console.log('\x1b[32m%s\x1b[0m', 'Deployment completed successfully!');
    console.log('\x1b[36m%s\x1b[0m', `Your app should now be available at: ${packageJson.homepage}`);
    console.log('\x1b[33m%s\x1b[0m', 'Note: It may take a few minutes for changes to propagate.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Deployment failed:', error.message);
    process.exit(1);
  }
} 