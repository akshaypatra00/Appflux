const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findGit() {
    const commonPaths = [
        'C:\\Program Files\\Git\\bin\\git.exe',
        'C:\\Program Files (x86)\\Git\\bin\\git.exe',
        'C:\\Windows\\System32\\git.exe'
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    try {
        const whereGit = execSync('where git', { encoding: 'utf8' }).split('\n')[0].trim();
        if (whereGit) return whereGit;
    } catch (e) {}
    return 'git';
}

const gitPath = findGit();
console.log('Using git path:', gitPath);

try {
    console.log('Status:');
    console.log(execSync(`"${gitPath}" status`, { encoding: 'utf8' }));
    
    console.log('Adding files...');
    execSync(`"${gitPath}" add .`, { stdio: 'inherit' });
    
    console.log('Committing changes...');
    execSync(`"${gitPath}" commit -m "Finalized project updates and bug fixes"`, { stdio: 'inherit' });
    
    console.log('Pushing to GitHub...');
    execSync(`"${gitPath}" push origin main`, { stdio: 'inherit' });
    
    console.log('✅ Success!');
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
