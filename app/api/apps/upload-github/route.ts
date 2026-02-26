import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function POST(req: NextRequest) {
    try {
        // Read metadata from headers to avoid multipart parsing limits
        const userId = req.headers.get('x-user-id');
        const fileNameOriginal = req.headers.get('x-file-name');

        if (!userId || !fileNameOriginal) {
            return NextResponse.json({ error: 'Missing metadata in headers' }, { status: 400 });
        }

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const owner = process.env.GITHUB_OWNER || 'akshaypatra99';
        const repo = process.env.GITHUB_REPO || 'appflux-app-storage';
        const branch = 'main';

        // 1. Read Raw Body as ArrayBuffer (More reliable for large files)
        const buffer = await req.arrayBuffer();
        const base64Content = Buffer.from(buffer).toString('base64');

        // Check size again just in case (GitHub limit is 100MB)
        if (buffer.byteLength > 100 * 1024 * 1024) {
            return NextResponse.json({ error: 'File exceeds 100MB limit' }, { status: 400 });
        }

        // 2. Create a Blob
        const { data: blob } = await octokit.rest.git.createBlob({
            owner,
            repo,
            content: base64Content,
            encoding: 'base64',
        });

        // 3. Get the latest commit SHA of the branch
        const { data: ref } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`,
        });
        const latestCommitSha = ref.object.sha;

        // 4. Create a Tree with the new blob
        const fileName = `${Date.now()}-${fileNameOriginal}`;
        const path = `${userId}/${fileName}`;

        const { data: tree } = await octokit.rest.git.createTree({
            owner,
            repo,
            base_tree: latestCommitSha,
            tree: [
                {
                    path,
                    mode: '100644', // Normal file
                    type: 'blob',
                    sha: blob.sha,
                },
            ],
        });

        // 5. Create a Commit
        const { data: commit } = await octokit.rest.git.createCommit({
            owner,
            repo,
            message: `Upload APK: ${fileNameOriginal} (Raw Stream Mode)`,
            tree: tree.sha,
            parents: [latestCommitSha],
        });

        // 6. Update the Reference
        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: commit.sha,
        });

        // 7. Return the raw download URL
        const downloadUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

        return NextResponse.json({
            success: true,
            downloadUrl,
            githubPath: path
        });

    } catch (error: any) {
        console.error('GitHub Raw Upload Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to upload to GitHub'
        }, { status: 500 });
    }
}
