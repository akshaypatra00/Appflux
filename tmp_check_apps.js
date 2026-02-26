const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkApps() {
    console.log("Fetching apps from Supabase...");
    const { data, error } = await supabase
        .from('apps')
        .select('id, name, icon_url')
        .limit(10);

    if (error) {
        console.error("Error fetching apps:", error);
        return;
    }

    console.log("Apps found:", data.length);
    data.forEach(app => {
        console.log(`- App: ${app.name}`);
        console.log(`  ID: ${app.id}`);
        console.log(`  Icon URL: ${app.icon_url}`);
        if (app.icon_url) {
            const isUrl = app.icon_url.startsWith('http');
            console.log(`  Valid URL format: ${isUrl}`);
        } else {
            console.log(`  Icon URL is missing (null/empty)`);
        }
    });
}

checkApps();
