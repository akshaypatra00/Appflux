# AppFlux: Core Project Documentation & PRD

## 1. Executive Summary
**AppFlux** is a next-generation, decentralized alternative to traditional mobile app stores. It empowers indie developers to bypass the "gatekeeping" of major platforms by providing an instant deployment pipeline directly from GitHub to a community-driven store. The platform focuses on high-performance aesthetics, developer-centric tools, and a frictionless user experience.

---

## 2. Technical Stack (v1.0.0)

### Frontend Architecture
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Runtime**: Turbopack (Dev) / Node.js
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Utility-first)
- **Animations**: Framer Motion & CSS keyframe animations
- **Icons**: Lucide React & Tabler Icons
- **3D/Graphics**: React Three Fiber (Three.js), Spline, and Rive for interactive avatars/elements.

### Backend & Infrastructure
- **BaaS**: [Supabase](https://supabase.com/)
- **Database**: PostgreSQL (Row Level Security enabled)
- **Authentication**: Supabase Auth (Supporting Email, Google, and GitHub OAuth)
- **Storage**: Supabase Storage Buckets (for APKs, App Icons, and User Avatars)
- **Server Logic**: Next.js Server Actions & API Routes (Edge compatible)
- **Middleware**: Custom session management and path protection.

### External Integrations
- **GitHub API**: Octokit integration for repository syncing, Release management, and automated APK artifact checking.
- **Client Utilities**: date-fns (Time formatting), JSZip (Client-side folder zipping), Sonner (Toast notifications).

---

## 3. Product Requirements Document (PRD)

### 3.1 Product Vision
To become the "GitHub of App Stores"—a place where deployment is as simple as a git push and discovery is driven by community quality rather than corporate algorithms.

### 3.2 Target Audience
1. **Indie Developers**: Looking for a fast way to get feedback on their APKs/Mobile projects.
2. **Beta Testers**: Early adopters who want to find and test cutting-edge apps.
3. **Company Teams**: Internal teams needing a private/semi-public distribution channel.

### 3.3 Core Feature Breakdown

#### A. Smart Onboarding
- **Multi-step Flow**: Gathers intent (usage, role, referral).
- **Profile Synchronization**: Automatic sync between Supabase Auth metadata and the public `profiles` table.
- **Visual Identity**: High-quality avatar upload with immediate global availability.

#### B. The Developer Dashboard
- **Analytics**: Real-time tracking of deployments, total views, and download counts.
- **Conversion Metrics**: Automatic calculation of "Downloads per View" to measure app performance.
- **Streak System**: Gamified developer activity tracking based on deployment frequency.
- **Live Notifications**: Sliding notification panel with real-time updates on build statuses and store activity.

#### C. Direct GitHub Deployment
- **Git Sync**: Connect repositories via OAuth or Personal Access Tokens (PAT).
- **Automated Mapping**: Platform-specific detection (Flutter, React Native, Java/Kotlin).
- **Artifact Detection**: Automatic scanning for existing APK builds within GitHub Releases.
- **Build Simulation**: Visual terminal-style progress for new builds.

#### D. The App Store
- **Search & Filter**: Real-time fuzzy search by name/description and category filtering (Android, iOS, Games, etc.).
- **Rich Cards**: Responsive app cards with download tracking and sharing capabilities.
- **Asset Management**: Automatic handling of icons and screenshots via cloud storage.

### 3.4 Non-Functional Requirements
- **Performance**: <1s Page transitions via Next.js App Router and optimized image loading.
- **Security**: Strict Row-Level Security (RLS) ensuring users only manage their own apps and deployments.
- **Scalability**: Stateless serverless architecture capable of handling surge traffic.
- **Aesthetics**: "Glassmorphism" UI design system for a premium, high-tech feel.

---

## 4. Database Schema Overview (Core Tables)

| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| `profiles` | User identity & metadata | `username`, `avatar_url`, `user_position`, `referral_source` |
| `apps` | Store listings | `name`, `github_url`, `download_count`, `category`, `icon_url` |
| `deployments` | Build history | `status`, `build_meta`, `commit_message`, `version` |
| `notifications` | User alerts | `title`, `message`, `type`, `is_read`, `user_id` |

---

## 5. Roadmap & Future Scope
- **Payment Integration**: Support for paid apps via Stripe.
- **Private Stores**: Invite-only stores for enterprise clients.
- **In-Browser Emulator**: Preview APKs directly in the browser using virtualized environments.
- **AI App Descriptions**: Automatic description generation based on codebase analysis.
