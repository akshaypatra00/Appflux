
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://twwmowovyrhdnzskppcq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3d21vd292eXJoZG56c2twcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTk2NzcsImV4cCI6MjA4NjM5NTY3N30.VTEgYOcznvmt3IJreIGOKdduQIdJTmh83SQ_I6OzDeI'
);

async function check() {
    console.log('--- START TEST ---');
    try {
        const res = await fetch('https://twwmowovyrhdnzskppcq.supabase.co/auth/v1/health').catch(err => ({ error: err.message }));
        console.log('Health Check Fetch:', JSON.stringify(res, null, 2));

        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
            console.log('Supabase Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('Success! Connected to Supabase.');
        }
    } catch (e) {
        console.log('Fatal Error:', e.message);
    }
    console.log('--- END TEST ---');
}

check();
