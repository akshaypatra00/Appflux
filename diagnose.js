
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length === 2) {
            env[parts[0].trim()] = parts[1].trim();
        }
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    console.log('--- Connection Test ---');
    console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);

    const start = Date.now();
    try {
        console.log('Testing Auth Health (5s timeout)...');
        const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
            signal: AbortSignal.timeout(5000),
            headers: { 'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
        }).catch(e => ({ error: e.message }));

        if (res.ok) {
            console.log('Auth Health Result: OK');
        } else {
            console.log('Auth Health Result:', res.error || res.statusText);
        }

        console.log('Testing DB Query...');
        const { data, error } = await supabase.from('apps').select('id').limit(1);
        if (error) {
            console.log('DB Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('DB Success! Found record count:', data.length);
        }
    } catch (e) {
        console.log('Fatal Error:', e.message);
    }
    console.log('Test completed in', Date.now() - start, 'ms');
}

test();
