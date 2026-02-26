
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
// If you have a service account key, use it. Otherwise, use env vars if configured for admin.
// For this script, we'll try to use the project ID from env and local auth if available.
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    require('dotenv').config({ path: '.env.local' });
}

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    // Fallback if no service account is found (might fail if not in authorized env)
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
}

const db = admin.firestore();

async function migrateProfiles() {
    console.log('--- Migrating Profiles ---');
    const profiles = [];
    return new Promise((resolve) => {
        fs.createReadStream(path.join(__dirname, 'public/profiles_rows.csv'))
            .pipe(csv())
            .on('data', (row) => profiles.push(row))
            .on('end', async () => {
                for (const profile of profiles) {
                    try {
                        const { id, ...data } = profile;
                        // Map fields to match Firestore schema
                        const firestoreData = {
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
                        };

                        await db.collection('profiles').doc(id).set(firestoreData, { merge: true });
                        console.log(`Migrated profile: ${id}`);
                    } catch (err) {
                        console.error(`Error migrating profile ${profile.id}:`, err.message);
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
        fs.createReadStream(path.join(__dirname, 'public/apps_rows.csv'))
            .pipe(csv())
            .on('data', (row) => apps.push(row))
            .on('end', async () => {
                for (const app of apps) {
                    try {
                        const { id, ...data } = app;

                        // Parse JSON fields safely
                        let screenshot_urls = [];
                        try {
                            if (data.screenshot_urls) {
                                // CSV might have double quotes escaped in a specific way
                                screenshot_urls = JSON.parse(data.screenshot_urls);
                            }
                        } catch (e) {
                            console.warn(`Could not parse screenshots for ${id}, using empty array`);
                        }

                        const firestoreData = {
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
                        };

                        await db.collection('apps').doc(id).set(firestoreData, { merge: true });
                        console.log(`Migrated app: ${data.name} (${id})`);
                    } catch (err) {
                        console.error(`Error migrating app ${app.id}:`, err.message);
                    }
                }
                resolve();
            });
    });
}

async function migrateDeployments() {
    console.log('--- Migrating Deployments ---');
    const deployments = [];
    return new Promise((resolve) => {
        fs.createReadStream(path.join(__dirname, 'public/deployments_rows.csv'))
            .pipe(csv())
            .on('data', (row) => deployments.push(row))
            .on('end', async () => {
                for (const dep of deployments) {
                    try {
                        const { id, ...data } = dep;
                        const firestoreData = {
                            app_id: data.app_id || '',
                            user_id: data.user_id || '',
                            status: data.status || 'queued',
                            version: data.version || '0.0.1',
                            created_at: data.created_at || new Date().toISOString(),
                            finished_at: data.finished_at || null,
                        };

                        await db.collection('deployments').doc(id).set(firestoreData, { merge: true });
                        console.log(`Migrated deployment: ${id}`);
                    } catch (err) {
                        console.error(`Error migrating deployment ${dep.id}:`, err.message);
                    }
                }
                resolve();
            });
    });
}

async function start() {
    try {
        await migrateProfiles();
        await migrateApps();
        await migrateDeployments();
        console.log('\n✅ CSV Migration Completed Successfully!');
    } catch (err) {
        console.error('\n❌ Migration Failed:', err.message);
    }
}

start();
