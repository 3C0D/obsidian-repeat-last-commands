import { execSync } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

console.log(`Starting the ${process.env.npm_lifecycle_event} process...\n`);
console.log('- Dependencies installed');

try {
    if (isWindows) {
        execSync("start /B code .", { stdio: "ignore", shell: true });
    } else {
        execSync("code .", { stdio: "ignore" });
    }
    console.log('- Opened current folder in VSCode');
} catch (error) {
    console.warn('Warning: Could not open VSCode');
}