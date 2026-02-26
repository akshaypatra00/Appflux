const { execSync } = require('child_process');
try {
    const output = execSync('git status', { encoding: 'utf8' });
    console.log(output);
} catch (error) {
    console.error('Error:', error.message);
    if (error.stdout) console.log('Stdout:', error.stdout);
    if (error.stderr) console.log('Stderr:', error.stderr);
}
