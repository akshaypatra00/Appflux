import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // Mock Build Process
        // In a real scenario, this would trigger a job in a build queue (e.g., BullMQ)
        // and return a job ID. The frontend would poll the job status.

        // We will simulate a build delay on the frontend or just return immediately here for the MVP "start build" action.

        // For this demo, we'll return a success immediately but the frontend will simulate the progress bar.
        // We'll return a "dummy" APK URL that points to a placeholder or a real sample APK if we had one.
        // Let's use a sample APK link for demonstration if needed, or just a placeholder string.

        const MOCK_APK_URL = "https://github.com/medic/cht-android/releases/download/v1.0.0/cht-android-v1.0.0.apk"; // Example valid APK

        // Simulate processing time if we were waiting here, but better to let frontend handle UI delay

        return NextResponse.json({
            success: true,
            buildId: 'mock-build-' + Date.now(),
            apkUrl: MOCK_APK_URL
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
