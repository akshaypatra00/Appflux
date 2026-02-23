import { createClient } from '@/lib/supabase/server';
import { Octokit } from 'octokit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { repoName, owner } = body;

        // Need user's GitHub token to access private repos
        const { data: { session } } = await supabase.auth.getSession();
        const providerToken = session?.provider_token;

        if (!providerToken) {
            return NextResponse.json({ error: 'GitHub token not found. Please re-authenticate with GitHub.' }, { status: 401 });
        }

        const octokitKey = new Octokit({ auth: providerToken });

        // 1. Check Releases first (most likely place for published APKs)
        try {
            const releases = await octokitKey.rest.repos.listReleases({
                owner,
                repo: repoName,
                per_page: 5
            });

            for (const release of releases.data) {
                const apkAsset = release.assets.find(asset => asset.name.endsWith('.apk'));
                if (apkAsset) {
                    return NextResponse.json({
                        found: true,
                        source: 'release',
                        apkUrl: apkAsset.browser_download_url,
                        version: release.tag_name,
                        name: release.name || repoName,
                        description: release.body || '',
                        releaseId: release.id
                    });
                }
            }
        } catch (e) {
            console.log('No releases found or error accessing releases', e);
        }

        // 2. perform a deeper search in the repo file tree (optional, skipping for MVP speed)
        // A full recursive search can be slow. We can check common paths.
        const commonPaths = [
            'app/build/outputs/apk/release/app-release.apk',
            'build/app/outputs/apk/release/app-release.apk',
            'release.apk',
            'app-release.apk'
        ];

        for (const path of commonPaths) {
            try {
                const content = await octokitKey.rest.repos.getContent({
                    owner,
                    repo: repoName,
                    path
                });

                if (content.data && !Array.isArray(content.data) && 'download_url' in content.data) {
                    return NextResponse.json({
                        found: true,
                        source: 'codebase',
                        apkUrl: content.data.download_url,
                        version: '1.0.0', // Default if found in code
                        name: repoName,
                        description: ''
                    });
                }
            } catch (e) {
                // Not found at this path, continue
            }
        }

        return NextResponse.json({ found: false });

    } catch (error: any) {
        console.error('Check APK Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
