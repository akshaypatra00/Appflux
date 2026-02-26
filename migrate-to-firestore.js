
const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, setDoc, doc, getDocs } = require('firebase/firestore');
const fs = require('fs');

// Load environment variables manually since dotenv might not be installed
function loadEnv() {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error("Could not load .env.local", e);
        return process.env;
    }
}

const env = loadEnv();

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateTable(tableName, collectionName) {
    console.log(`Migrating ${tableName} -> ${collectionName}...`);
    try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;

        console.log(`Found ${data.length} records in ${tableName}.`);

        let successCount = 0;
        for (const item of data) {
            try {
                // Use id as the document ID if it exists, otherwise let Firestore generate one
                const id = item.id || item.uid;
                if (id) {
                    await setDoc(doc(db, collectionName, String(id)), item);
                } else {
                    await addDoc(collection(db, collectionName), item);
                }
                successCount++;
            } catch (err) {
                console.error(`Error migrating item from ${tableName}:`, err.message);
            }
        }
        console.log(`Successfully migrated ${successCount}/${data.length} records.`);
    } catch (err) {
        console.error(`Failed to migrate table ${tableName}:`, err.message);
    }
}

async function runMigration() {
    console.log("--- Starting Migration ---");

    // Test Supabase Connection first
    try {
        const { error } = await supabase.from('apps').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("CANNOT REACH SUPABASE. Please turn on your VPN!");
            process.exit(1);
        }
    } catch (e) {
        console.error("CANNOT REACH SUPABASE. Connection error.");
        process.exit(1);
    }

    await migrateTable('profiles', 'profiles');
    await migrateTable('apps', 'apps');
    await migrateTable('deployments', 'deployments');

    console.log("--- Migration Finished ---");
    process.exit(0);
}

runMigration();
