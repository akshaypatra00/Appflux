# AppFlux Deployment System Architecture

This document describes the high-level architecture, deployment flow, and build pipeline for AppFlux, a production-grade automated deployment platform for mobile, web, and desktop applications.

## 1. System High-Level Architecture

The components are separated to ensure scalability, security, and performance.

### **Frontend (Next.js + Tailwind)**
- **Role**: Dashboard UI, Deployment Interface, Public App Pages
- **Responsibilities**:
  - Handle User Authentication (Supabase/GitHub OAuth)
  - Display Build Logs (via WebSocket/Polling)
  - Allow users to configure deployment settings
  - Serve the Public App Download page
- **Tech Stack**: Next.js, React, Tailwind CSS, Supabase Client

### **Build Backend Service (Node.js + Express)**
- **Role**: Orchestrates the build process and manages queues
- **Responsibilities**:
  - Receive deployment requests (Webhook or Manual Trigger)
  - Queue build jobs (BullMQ + Redis)
  - Manage worker nodes
  - Interface with Storage (S3/Supabase Storage) and DB (MongoDB for logs/metadata)
  - Handle GitHub Webhooks
- **Tech Stack**: Node.js, Express, BullMQ, Redis, MongoDB

### **Worker Nodes (Docker)**
- **Role**: Execute the actual build commands in isolated environments
- **Responsibilities**:
  - Spawn Docker containers per build type (Android/Web/etc.)
  - Run build scripts
  - Upload artifacts to storage
  - Report status back to Backend Service
- **Build Environments**:
  - `appflux/android-builder`: JDK, Android SDK, Gradle
  - `appflux/web-builder`: Node.js, Bun, pnpm/npm/yarn
  - `appflux/flutter-builder`: Flutter SDK

### **Storage & Database**
- **Artifact Storage**: S3-compatible service (AWS S3, MinIO, or Supabase Storage)
- **Metadata DB**: MongoDB (for complex build logs, analytics) + Supabase (User/Auth/App linking)

---

## 2. Updated Database Schema (MongoDB / Supabase Concept)

Since the user requested MongoDB, we will design the `Builds` and `Deployments` collections here.

### **Users (Supabase Auth)**
- `id` (UUID) - Managed by Supabase
- `email`
- `github_access_token`

### **Apps (Collection: `apps`)**
```json
{
  "_id": "ObjectId",
  "ownerId": "UUID (Supabase User ID)",
  "name": "My App",
  "slug": "my-app",
  "type": "android | web | pwa | desktop",
  "source": {
    "provider": "github | upload",
    "repoUrl": "https://github.com/user/repo",
    "branch": "main",
    "rootDirectory": "./"
  },
  "envVars": {
    "API_URL": "...",
    "KEY": "..."
  },
  "framework": "react-native | flutter | nextjs | vite",
  "createdAt": "ISODate"
}
```

### **Deployments (Collection: `deployments`)**
```json
{
  "_id": "ObjectId",
  "appId": "ObjectId (Ref: Apps)",
  "status": "queued | building | success | failed",
  "commitHash": "a1b2c3d...",
  "commitMessage": "Fix login bug",
  "buildLogs": [
    { "timestamp": "...", "message": "Installing dependencies..." },
    { "timestamp": "...", "message": "Build started..." }
  ],
  "artifactUrl": "https://s3.bucket/apps/{appId}/{deploymentId}/app-release.apk",
  "version": "1.0.2",
  "durationSeconds": 145,
  "startedAt": "ISODate",
  "finishedAt": "ISODate"
}
```

---

## 3. Build Pipeline Flow

1.  **Trigger**: User pushes to GitHub or Uploads ZIP via Dashboard.
2.  **Request**: Frontend sends `POST /deploy` to Build Backend.
3.  **Queue**: Backend adds job to BullMQ (`deploy-queue`).
4.  **Worker Pick-up**: A worker node picks up the job.
5.  **Preparation**:
    -   Clone Repo / Download ZIP.
    -   Detect Project Type (scan `package.json`, `build.gradle`, etc.).
    -   Validate Structure.
6.  **Security Scan**: Run ClamAV or similar scanner on source.
7.  **Build Execution (Docker)**:
    -   Start container: `docker run --rm -v /tmp/source:/app appflux/{type}-builder`
    -   Run build command (e.g., `./gradlew assembleRelease`).
8.  **Artifact Handling**:
    -   If success: Upload output (APK/DMG/ZIP) to S3.
    -   Update `deployments` DB with URL.
9.  **Notification**: Webhook back to Frontend/User (Email/Slack).

---

## 4. Example API Implementation (Node.js/Express Backend)

### **Server Setup (`server.js`)**

```javascript
const express = require('express');
const { Queue } = require('bullmq');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI);

// BullMQ Queue
const buildQueue = new Queue('build-queue', {
  connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }
});

// Deploy Route
app.post('/api/deploy', async (req, res) => {
  const { appId, userId, source } = req.body;

  // 1. Validate User & App
  // 2. Create Deployment Record
  const deployment = await Deployment.create({
    appId,
    status: 'queued',
    startedAt: new Date()
  });

  // 3. Add to Queue
  await buildQueue.add('build-job', {
    deploymentId: deployment._id,
    source,
    appId
  });

  res.json({ success: true, deploymentId: deployment._id });
});

app.listen(3001, () => console.log('Build Server running on port 3001'));
```

### **Worker Implementation (`worker.js`)**

```javascript
const { Worker } = require('bullmq');
const Docker = require('dockerode');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const docker = new Docker();
const s3 = new S3Client({ region: process.env.AWS_REGION });

const worker = new Worker('build-queue', async job => {
  const { deploymentId, source } = job.data;
  
  // Update Status: 'building'
  await updateStatus(deploymentId, 'building');

  try {
    // 1. Clone/Download Source
    const sourcePath = await prepareSource(source);

    // 2. Detect Type
    const projectType = detectProjectType(sourcePath); // e.g., 'android'

    // 3. Run Docker Build
    const container = await docker.run(
      `appflux/${projectType}-builder`,
      ['build-script.sh'],
      process.stdout,
      {
        HostConfig: {
          Binds: [`${sourcePath}:/app`],
          Memory: 4 * 1024 * 1024 * 1024, // Limit 4GB RAM
          NanoCpus: 2000000000 // Limit 2 CPUs
        }
      }
    );
    
    // Check exit code...

    // 4. Upload Artifact
    const artifactPath = `${sourcePath}/output/app-release.apk`;
    const fileStream = fs.createReadStream(artifactPath);
    
    await s3.send(new PutObjectCommand({
      Bucket: 'appflux-builds',
      Key: `apps/${job.data.appId}/${deploymentId}/app.apk`,
      Body: fileStream
    }));

    // Update Status: 'success'
    await updateStatus(deploymentId, 'success');

  } catch (error) {
    console.error(error);
    await updateStatus(deploymentId, 'failed', error.message);
  }
}, { connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT } });
```

---

## 5. Security Measures

1.  **Isolation**: Every build runs in a disposable Docker container with no network access (except explicitly allowed package registries).
2.  **Resource Limits**: Docker containers are limited in CPU and RAM usage to prevent DoS.
3.  **Sanitization**: Uploaded ZIP files are scanned for malware before extraction.
4.  **Envs**: Environment variables are injected at runtime securely, never stored in the code repo.
5.  **Timeouts**: Builds longer than 30 minutes are automatically killed.

---

## 6. Frontend Deployment UI (React/Next.js)

The frontend will consist of a multi-step form:
1.  **Select Source**: GitHub or Upload.
2.  **Configure**: Branch, Root Directory, Environmental Variables.
3.  **Confirm & Deploy**: Triggers the API.
