import { createClient } from '@/lib/supabase/server';
import { Octokit } from 'octokit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    // Auth check removed to support Firebase Auth users

    try {
        const body = await req.json();
        const { repoName, owner, githubToken } = body;

        // Use provided token or fallback to Supabase session (though Supabase is likely down)
        let providerToken = githubToken;

        if (!providerToken) {
            const { data: { session } } = await supabase.auth.getSession();
            providerToken = session?.provider_token;
        }

        if (!providerToken) {
            return NextResponse.json({ error: 'GitHub token not found. Please provide a token or re-authenticate.' }, { status: 401 });
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
