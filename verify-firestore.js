
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
}

const db = admin.firestore();

async function check() {
    try {
        const snapshot = await db.collection('apps').get();
        console.log(`Connection test: Found ${snapshot.size} apps in Firestore.`);
        snapshot.forEach(doc => {
            console.log(`- App: ${doc.data().name} (${doc.id})`);
        });
    } catch (e) {
        console.error("FAILED to read Firestore:", e.message);
    }
}

check();
