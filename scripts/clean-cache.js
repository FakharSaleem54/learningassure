const fs = require('fs');
const path = require('path');

const dotNextPath = path.join(__dirname, '..', '.next');

console.log('Cleaning Next.js cache...');

try {
    if (fs.existsSync(dotNextPath)) {
        fs.rmSync(dotNextPath, { recursive: true, force: true });
        console.log('Successfully deleted .next folder.');
    } else {
        console.log('.next folder does not exist.');
    }
    console.log('You can now restart the server with: npm run dev');
} catch (error) {
    console.error('Error deleting .next folder:', error.message);
    console.log('Please stop the running server (Ctrl+C) and try again.');
}
