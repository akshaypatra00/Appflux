# Backend Architecture & Setup Guide

## Architecture Overview
This backend uses **Next.js API Routes** (Serverless Functions) to handle logic, keeping everything in one project without a separate server.

### 1. Data Flow
- **Upload (`POST /api/upload-app`)**:
  1.  Admin uploads APK + Metadata.
  2.  Server authenticates to GitHub using a hidden Token.
  3.  Server creates a **GitHub Release** (e.g., `v1.0.0`) and uploads the APK as an asset.
  4.  Server saves metadata (Name, Version, Download URL) to **Supabase**.
- **Download (`GET /api/download/:id`)**:
  1.  User requests download.
  2.  Server increments `download_count` in Supabase.
  3.  Server **redirects** user to the secure GitHub asset URL.
      *   *Note: This keeps the storage provider abstract, though a tech-savvy user could see the final URL in their browser history.*

### 2. Zero Budget Stack
- **Compute**: Vercel (Next.js hosting) - Free Tier.
- **Storage**: GitHub Releases - Free, Unlimited bandwidth/storage for public repos.
- **Database**: Supabase - Free Tier.

## Setup Instructions

### Step 1: GitHub Setup
1.  Create a **Public** GitHub Repository (or Private if you have Supabase Pro, but Public is best for free bandwidth).
2.  Generate a **Personal Access Token (Classic)** with `repo` scope.
3.  Add the token and repo details to `.env.local` (Completed).

### Step 2: Database Setup
1.  Go to your Supabase Dashboard -> SQL Editor.
2.  Run the contents of `supabase/migrations/20260213_create_apps_table.sql`.
    *   This creates the `apps` table and sets up security policies.

### Step 3: Deploy
1.  Push your code to GitHub.
2.  Deploy to Vercel.
3.  **Important**: Add the Environment Variables (`GITHUB_TOKEN`, etc.) to your Vercel Project Settings.

## API Documentation

### POST /api/upload-app
- **Headers**: `Content-Type: multipart/form-data`
- **Body**:
    - `appName`: Text
    - `version`: Text (e.g. "1.0.0")
    - `description`: Text
    - `apkFile`: File (APK)
- **Response**: JSON with app details.

### GET /api/apps
- **Response**: JSON list of all apps.

### GET /api/download/:id
- **Response**: 307 Redirect to the file.

## Limitations
- **File Size**: On Vercel's Free Tier, uploads > 4.5MB will fail due to body size limits.
- **Workaround**: To support large APKs for free:
    1.  Host this API on a cheap VPS (DigitalOcean, Railway, etc.) where limits are higher.
    2.  Or, use the GitHub Website to upload the release manually, then add the metadata to the DB manually.
