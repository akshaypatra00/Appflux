# AppFlux 🚀  
**Decentralized App Distribution, Powered by GitHub**

AppFlux is a next-generation, decentralized alternative to traditional mobile app stores. It enables developers to deploy applications directly from GitHub into a community-driven store—without platform gatekeeping, long review cycles, or restrictive policies.

---

## ✨ Key Features

### 🔐 Smart Authentication & Onboarding
- Secure authentication via Supabase Auth (Email, Google, GitHub OAuth)
- Multi-step onboarding to capture developer intent and profile metadata
- Automatic sync between auth metadata and public profiles

### 🧑‍💻 Developer Dashboard
- Real-time analytics for views, downloads, and deployments
- Conversion metrics (Downloads per View)
- Deployment streak system to encourage consistent shipping
- Live notifications for build and store activity

### 🔁 Direct GitHub Deployment
- GitHub OAuth & PAT-based repository linking
- Automatic framework detection (Flutter, React Native, Kotlin/Java)
- APK artifact scanning from GitHub Releases
- Terminal-style visual build simulation

### 🏪 Community-Driven App Store
- Real-time fuzzy search and category filtering
- Rich, responsive app cards
- Secure asset storage for icons, screenshots, and APKs
- Download tracking and sharing

---

## 🧱 Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **3D & Motion**: React Three Fiber, Spline, Rive
- **Icons**: Lucide React, Tabler Icons

### Backend & Infrastructure
- **BaaS**: Supabase
- **Database**: PostgreSQL (Row Level Security enabled)
- **Auth**: Supabase Auth (OAuth + Email)
- **Storage**: Supabase Buckets (APKs, icons, avatars)
- **Server Logic**: Next.js Server Actions & API Routes

### Integrations
- **GitHub API** (Octokit) for repo sync and release parsing
- **Utilities**: date-fns, JSZip, Sonner

---

## 🗄️ Database Overview

| Table | Purpose |
|------|--------|
| `profiles` | User identity and metadata |
| `apps` | App listings and store data |
| `deployments` | Build and deployment history |
| `notifications` | Real-time user alerts |

All tables are protected with **Row Level Security (RLS)**.

---

## 🧠 Problem Statement

Traditional app stores introduce significant friction:
- Long review cycles
- Arbitrary rejections
- High platform fees
- Limited control for indie developers

Developers lack a fast, transparent way to distribute apps directly from their codebase.

---

## ✅ What AppFlux Solves

- 🚫 Removes centralized gatekeeping
- ⚡ Enables instant deployment from GitHub
- 🔍 Makes app discovery community-driven
- 📊 Gives developers ownership of analytics
- 🔐 Ensures security with fine-grained access control

---

## 🛣️ Roadmap

- Paid apps via Stripe
- Private app stores for teams
- In-browser APK emulator
- AI-generated app descriptions

---

## 📦 Status
**v1.0.0 – Feature Complete**  
Production-ready and actively evolving.

---

## 🤝 Contributions
Feedback, issues, and PRs are welcome.
