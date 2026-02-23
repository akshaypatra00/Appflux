import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GITHUB_OWNER, GITHUB_REPO, octokit } from '@/lib/github';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const appName = formData.get('appName') as string;
        const version = formData.get('version') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const file = formData.get('apkFile') as File;
        const iconFile = formData.get('iconFile') as File | null;
        const screenshotFiles = formData.getAll('screenshotFiles') as File[];

        if (!appName || !version || !file) {
            return NextResponse.json(
                { error: 'Missing required fields: appName, version, apkFile' },
                { status: 400 }
            );
        }

        if (!GITHUB_OWNER || !GITHUB_REPO) {
            return NextResponse.json(
                { error: 'Server configuration error: GitHub Owner/Repo not set' },
                { status: 500 }
            );
        }

        const sanitizedVersion = version.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
        const tagName = `v${sanitizedVersion}`;

        let release;
        try {
            const existingRelease = await octokit.rest.repos.getReleaseByTag({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                tag: tagName
            });
            release = existingRelease.data;
        } catch (e: any) {
            if (e.status === 404) {
                const newRelease = await octokit.rest.repos.createRelease({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    tag_name: tagName,
                    name: `${appName} v${version}`,
                    body: description || `Release for ${appName} version ${version}`,
                    draft: false,
                    prerelease: false,
                });
                release = newRelease.data;
            } else {
                throw e;
            }
        }

        const fileBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);
        const timestamp = Date.now();
        const apkFileName = `${appName.replace(/\s+/g, '-').toLowerCase()}-${version}-${timestamp}.apk`;
        const supabase = await createClient();

        const existingAssets = await octokit.rest.repos.listReleaseAssets({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            release_id: release.id,
        });

        const existingAsset = existingAssets.data.find(a => a.name === file.name);
        if (existingAsset) {
            await octokit.rest.repos.deleteReleaseAsset({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                asset_id: existingAsset.id,
            });
        }

        const uploadResponse = await octokit.rest.repos.uploadReleaseAsset({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            release_id: release.id,
            name: apkFileName,
            data: buffer as any,
            headers: {
                'content-type': file.type || 'application/vnd.android.package-archive',
                'content-length': buffer.length,
            },
        });

        const browserDownloadUrl = uploadResponse.data.browser_download_url;

        let iconDownloadUrl = null;
        if (iconFile) {
            const iconFileName = `icons/${timestamp}-${iconFile.name.replace(/\s+/g, '-')}`;

            const { data: iconData, error: iconError } = await supabase
                .storage
                .from('app-assets')
                .upload(iconFileName, iconFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (iconError) {
                console.error('Icon upload error:', iconError);
            } else {
                const { data: publicUrlData } = supabase
                    .storage
                    .from('app-assets')
                    .getPublicUrl(iconFileName);
                iconDownloadUrl = publicUrlData.publicUrl;
            }
        }

        const screenshotDownloadUrls: string[] = [];
        if (screenshotFiles && screenshotFiles.length > 0) {
            for (const sFile of screenshotFiles) {
                if (sFile.size === 0) continue;

                const sFileName = `screenshots/${timestamp}-${sFile.name.replace(/\s+/g, '-')}`;

                const { data: sData, error: sError } = await supabase
                    .storage
                    .from('app-assets')
                    .upload(sFileName, sFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (sError) {
                    console.error('Screenshot upload error:', sError);
                } else {
                    const { data: publicUrlData } = supabase
                        .storage
                        .from('app-assets')
                        .getPublicUrl(sFileName);
                    screenshotDownloadUrls.push(publicUrlData.publicUrl);
                }
            }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('apps')
            .insert([
                {
                    name: appName,
                    version: version,
                    description: description,
                    github_release_id: release.id,
                    github_download_url: browserDownloadUrl,
                    icon_url: iconDownloadUrl,
                    screenshot_urls: screenshotDownloadUrls,
                    category: category,
                    download_count: 0,
                    user_id: user.id
                },
            ])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'App uploaded successfully',
            app: data[0],
            downloadUrl: browserDownloadUrl
        });

    } catch (error: any) {
        console.error('Upload Error Details:', {
            message: error.message,
            status: error.status,
            response: error.response?.data
        });
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
