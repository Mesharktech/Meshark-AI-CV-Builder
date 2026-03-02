const fs = require('fs');

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

console.log("Checking required environment variables...");
const missing = requiredEnvVars.filter(env => !process.env[env]);

if (missing.length > 0) {
    console.error(`❌ Build failed! Missing required environment variables:\n  ${missing.join('\n  ')}`);
    process.exit(1);
} else {
    console.log("✅ All required environment variables are present.");
}
