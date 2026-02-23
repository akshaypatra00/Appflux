import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const version = formData.get('version') as string;
        const apkUrl = formData.get('apkUrl') as string;
        const category = formData.get('category') as string;

        const iconFile = formData.get('iconFile') as File | null;
        const screenshotFiles = formData.getAll('screenshotFiles') as File[];

        let iconUrl = null;
        let screenshotUrls: string[] = [];

        // Upload Icon
        if (iconFile && iconFile.size > 0) {
            const fileName = `${user.id}/${Date.now()}-icon-${iconFile.name.replace(/\s+/g, '-')}`;
            const { data, error } = await supabase.storage
                .from('app-assets')
                .upload(fileName, iconFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const publicUrl = supabase.storage
                .from('app-assets')
                .getPublicUrl(fileName).data.publicUrl;

            iconUrl = publicUrl;
        }

        // Upload Screenshots
        if (screenshotFiles && screenshotFiles.length > 0) {
            for (const file of screenshotFiles) {
                if (file.size > 0) {
                    const fileName = `${user.id}/${Date.now()}-screen-${file.name.replace(/\s+/g, '-')}`;
                    const { data, error } = await supabase.storage
                        .from('app-assets')
                        .upload(fileName, file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (error) {
                        console.error('Screenshot upload error:', error);
                        continue;
                    }

                    const publicUrl = supabase.storage
                        .from('app-assets')
                        .getPublicUrl(fileName).data.publicUrl;

                    screenshotUrls.push(publicUrl);
                }
            }
        }

        // Insert App
        const { data, error } = await supabase
            .from('apps')
            .insert([
                {
                    name,
                    version: version || '1.0.0',
                    description,
                    github_download_url: apkUrl, // Ensure this maps correctly in schema
                    icon_url: iconUrl,
                    screenshot_urls: screenshotUrls,
                    category: category || 'Utilities',
                    user_id: user.id,
                    download_count: 0
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Publish Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, app: data });

    } catch (error: any) {
        console.error('Publish API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
