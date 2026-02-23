/**
 * AppFlux Build Worker Example (Node.js + BullMQ)
 * 
 * This file demonstrates the worker implementation that listens for build jobs,
 * spins up Docker containers, and handles artifact uploads.
 * 
 * Dependencies: npm install bullmq dockerode @aws-sdk/client-s3 ioredis dotenv mongoose
 */

require('dotenv').config();
const { Worker } = require('bullmq');
const Docker = require('dockerode');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); // Using Supabase JS Client for DB updates

// Initialize Services
const docker = new Docker(); // Connects to local Docker socket
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Status Update Utility
async function updateDeploymentStatus(id, status, logs = [], artifactUrl = null) {
    const updates = { status, finished_at: status === 'success' || status === 'failed' ? new Date() : null };
    if (logs.length > 0) updates.build_logs = logs;
    if (artifactUrl) updates.artifact_url = artifactUrl;

    await supabase.from('deployments').update(updates).eq('id', id);
}

// Log Appender
function createLogger(deploymentId) {
    const logs = [];
    return {
        log: (msg) => {
            console.log(`[${deploymentId}] ${msg}`);
            logs.push({ timestamp: new Date().toISOString(), message: msg });
        },
        getLogs: () => logs
    };
}

// Worker Definition
const worker = new Worker('build-queue', async job => {
    const { deploymentId, appId, source, projectType } = job.data;
    const logger = createLogger(deploymentId);
    const tempDir = path.join('/tmp', `build-${deploymentId}`);

    logger.log(`Starting build for ${appId} (Type: ${projectType})`);
    await updateDeploymentStatus(deploymentId, 'building', logger.getLogs());

    try {
        // 1. Prepare Environment
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        // 2. Fetch Source Code (Mock implementation)
        // In production: git clone source.repoUrl or download source.zip from S3/Storage
        logger.log('Fetching source code...');
        // await downloadSource(source, tempDir); 

        // 3. Security Scan (ClamAV)
        logger.log('Running security scan...');
        // await runSecurityScan(tempDir);

        // 4. Determine Build Command & Image
        let buildImage = '';
        let buildCmd = [];

        switch (projectType) {
            case 'android':
                buildImage = 'appflux/android-builder:latest';
                buildCmd = ['./gradlew', 'assembleRelease'];
                break;
            case 'web':
                buildImage = 'appflux/node-builder:18';
                buildCmd = ['sh', '-c', 'npm ci && npm run build'];
                break;
            case 'pwa':
                buildImage = 'appflux/node-builder:18';
                buildCmd = ['sh', '-c', 'npm ci && npm run build'];
                break;
            default:
                throw new Error(`Unsupported project type: ${projectType}`);
        }

        logger.log(`Launching container: ${buildImage}`);

        /* 
         * Docker Execution (Simulated for this script)
         * Real implementation would use:
         * const container = await docker.run(buildImage, buildCmd, process.stdout, { ...config });
         */

        // Simulate Build Time
        await new Promise(resolve => setTimeout(resolve, 5000));
        logger.log('Build completed successfully.');

        // 5. Upload Artifact
        const artifactPath = path.join(tempDir, 'dist', 'app-release.apk'); // Assuming output path
        const s3Key = `apps/${appId}/${deploymentId}/release.apk`;

        // simulate file read
        // const fileContent = fs.readFileSync(artifactPath);
        /*
        await s3.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: fileContent
        }));
        */
        const artifactUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
        logger.log(`Artifact uploaded to ${artifactUrl}`);

        // 6. Finalize
        await updateDeploymentStatus(deploymentId, 'success', logger.getLogs(), artifactUrl);

    } catch (err) {
        logger.log(`Build Failed: ${err.message}`);
        await updateDeploymentStatus(deploymentId, 'failed', logger.getLogs());
        throw err; // Re-throw to BullMQ handles retry if configured
    } finally {
        // Cleanup Temp Dir
        // fs.rmdirSync(tempDir, { recursive: true });
    }

}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    concurrency: 5 // Process 5 builds in parallel
});

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} has failed with ${err.message}`);
});
