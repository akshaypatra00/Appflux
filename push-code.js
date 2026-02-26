const { execSync } = require('child_process');

try {
    console.log('Adding files...');
    execSync('git add .', { stdio: 'inherit' });
    
    console.log('Committing changes...');
    execSync('git commit -m "Finalized onboarding flow, fixed pricing crash, and implemented real app sizes"', { stdio: 'inherit' });
    
    console.log('Pushing to GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Successfully pushed to GitHub!');
} catch (error) {
    console.error('❌ Error during git operations:', error.message);
    process.exit(1);
}
