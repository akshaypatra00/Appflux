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
        const source = formData.get('source') as string; // 'github' | 'upload'

        // Initial Deployment Data
        const deploymentData: any = {
            user_id: user.id,
            status: 'queued',
            source_type: source,
            created_at: new Date().toISOString(),
            build_meta: {
                project_name: formData.get('projectName'),
                framework: formData.get('framework'),
                root_directory: formData.get('rootDirectory'),
                build_command: formData.get('buildCommand'),
                output_directory: formData.get('outputDirectory')
            }
        };

        if (source === 'github') {
            deploymentData.source_url = formData.get('repoUrl');
            deploymentData.commit_message = `Manual deploy from ${formData.get('branch')}`;
            deploymentData.version = '0.0.1'; // Default versioning logic
        } else if (source === 'upload') {
            const file = formData.get('file') as File;
            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            // Upload file to Supabase Storage (if configured)
            // For this example, we'll store the path
            const filePath = `${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('deployments')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                return NextResponse.json({ error: 'Failed to upload project file' }, { status: 500 });
            }

            deploymentData.source_url = filePath;
            deploymentData.commit_message = `Uploaded source: ${file.name}`;
            deploymentData.version = '0.0.1';
        } else {
            return NextResponse.json({ error: 'Invalid source type' }, { status: 400 });
        }

        // Insert into deployments DB
        const { data, error } = await supabase
            .from('deployments')
            .insert(deploymentData)
            .select()
            .single();

        if (error) {
            console.error('DB insert error:', error);
            return NextResponse.json({
                error: `Failed to create deployment record: ${error.message}`,
                details: error.details,
                hint: error.hint
            }, { status: 500 });
        }

        // Attempt to parse project type if upload (Optional - if we want to determine type here)
        // We could use the 'project-detector' lib if we can read the file buffer.

        // Trigger Build Worker (Mock)
        // In production: fetch('https://build-service.internal/api/queue', { ... })

        return NextResponse.json({ success: true, deployment: data });
    } catch (err: any) {
        console.error('Deploy API error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
