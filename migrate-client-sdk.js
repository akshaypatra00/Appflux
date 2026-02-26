
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, serverTimestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateProfiles() {
    console.log('--- Migrating Profiles ---');
    const profiles = [];
    return new Promise((resolve) => {
        const filePath = path.join(__dirname, 'public/profiles_rows.csv');
        if (!fs.existsSync(filePath)) {
            console.warn("Profiles CSV not found, skipping.");
            return resolve();
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => profiles.push(row))
            .on('end', async () => {
                for (const profile of profiles) {
                    try {
                        const { id, ...data } = profile;
                        await setDoc(doc(db, 'profiles', id), {
                            username: data.username || '',
                            first_name: data.first_name || '',
                            last_name: data.last_name || '',
                            full_name: data.full_name || '',
                            avatar_url: data.avatar_url || '',
                            email: data.email || '',
                            updated_at: data.updated_at || new Date().toISOString(),
                            created_at: data.created_at || new Date().toISOString(),
                            platform_usage: data.platform_usage || '',
                            user_position: data.user_position || '',
                            referral_source: data.referral_source || ''
                        }, { merge: true });
                        console.log(`✅ Migrated profile: ${id}`);
                    } catch (err) {
                        console.error(`❌ Error migrating profile ${profile.id}:`, err.message);
                    }
                }
                resolve();
            });
    });
}

async function migrateApps() {
    console.log('--- Migrating Apps ---');
    const apps = [];
    return new Promise((resolve) => {
        const filePath = path.join(__dirname, 'public/apps_rows.csv');
        if (!fs.existsSync(filePath)) {
            console.warn("Apps CSV not found, skipping.");
            return resolve();
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => apps.push(row))
            .on('end', async () => {
                for (const appRow of apps) {
                    try {
                        const { id, ...data } = appRow;
                        let screenshot_urls = [];
                        if (data.screenshot_urls) {
                            try {
                                screenshot_urls = JSON.parse(data.screenshot_urls.replace(/""/g, '"'));
                            } catch (e) {
                                // Fallback for double quoted CSV strings
                                screenshot_urls = data.screenshot_urls.replace(/[\[\]"]/g, '').split(',');
                            }
                        }

                        await setDoc(doc(db, 'apps', id), {
                            name: data.name || '',
                            version: data.version || '1.0.0',
                            description: data.description || '',
                            download_count: parseInt(data.download_count) || 0,
                            views: parseInt(data.views) || 0,
                            github_download_url: data.github_download_url || '',
                            icon_url: data.icon_url || '',
                            screenshot_urls: screenshot_urls,
                            category: data.category || 'android',
                            user_id: data.user_id || '',
                            created_at: data.created_at || new Date().toISOString(),
                            updated_at: data.updated_at || new Date().toISOString()
                        }, { merge: true });
                        console.log(`✅ Migrated app: ${data.name}`);
                    } catch (err) {
                        console.error(`❌ Error migrating app ${appRow.id}:`, err.message);
                    }
                }
                resolve();
            });
    });
}

async function start() {
    console.log("Starting Migration using Client SDK...");
    await migrateProfiles();
    await migrateApps();
    console.log('\nMigration process finished.');
    process.exit(0);
}

start();
