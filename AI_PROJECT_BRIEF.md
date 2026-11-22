# TALENTO-AI Project Brief

This file is a compact, AI-friendly briefing for the TALENTO-AI repository. It is written so another model can quickly understand the codebase, the product scope, and the main implementation risks.

## 1. Project Identity

- Product: TALENTO-AI
- Type: Next.js web application
- Domain: AI-powered interview preparation, resume optimization, job search, assessments, and career tools
- Primary frontend language: JavaScript
- Frontend framework: Next.js App Router with React 19
- Styling: Tailwind CSS with custom global CSS
- Main backend dependencies: Supabase, Razorpay, Nodemailer, and a separate Python/FastAPI service for several AI/assessment endpoints

## 2. What The App Does

The application is a career-preparation platform with these user-facing areas:

- Landing/marketing home page with feature sections, testimonials, FAQ, and contact form
- Authentication and onboarding flows
- User dashboard with modular tabs for overview, assessment, progress, history, jobs, LinkedIn tools, referrals, profile, and subscriptions
- Assessment flows for technical, aptitude, communication, and personality practice
- Resume upload and optimization flows
- Job search and saved-jobs management
- Payment subscription flow using Razorpay
- LinkedIn integration endpoints and posting tools
- Admin/demo and test utility pages

## 3. Stack Summary

### Frontend

- Next.js 15.4.1
- React 19.1.0
- Tailwind CSS 3.4.18
- Framer Motion
- Chart.js and react-chartjs-2
- Heroicons and react-icons
- SWR
- Geist and Geist Mono fonts via next/font

### Backend And Services

- Supabase for auth, sessions, storage, and database access
- Razorpay for payment creation and verification
- Nodemailer for email sending
- Remotive API for job search
- External Python/FastAPI backend for assessment, resume, and LinkedIn proxy endpoints

### Dev Tooling

- Vitest and React Testing Library
- Storybook
- ESLint
- Vercel deployment config

## 4. Repository Structure Overview

- app/ contains the Next.js App Router routes, shared UI, contexts, and hooks
- utils/ contains helper functions, Supabase client/server factories, and data stores
- tests/ contains Vitest tests
- stories/ contains Storybook stories and component docs
- model/ contains SQL/schema assets
- public/ contains static assets such as logo and images
- deploy_railway.py and runtime.txt indicate a separate Python deployment target

## 5. Route Map

### Public And Marketing Routes

- / -> app/page.jsx, the main landing page
- /career -> career-focused page
- /practice -> practice page
- /payment -> Razorpay subscription page
- /privacy -> privacy policy page
- /demo-request -> demo request page
- /warning -> warning page
- /not-found -> custom not-found page

### Authentication And Onboarding

- /login -> login page
- /signup -> signup page
- /auth -> auth hub page
- /auth/auth-code-error -> auth error page
- /auth/linkedin/callback -> LinkedIn callback handling page
- /forgot-password -> password recovery start page
- /reset -> password reset page
- /reset/update-password -> password update page
- /verify-otp -> OTP verification page
- /onboarding -> onboarding flow
- /test-auth -> authentication testing page

### Dashboard And User Areas

- /dashboard -> main authenticated shell with tabbed dashboard UI
- /profile -> profile page
- /profile-demo -> demo profile page
- /admin -> admin/demo page

### Assessment Flows

- /assessment -> assessment hub
- /assessment/aptitude -> aptitude practice
- /assessment/communication -> communication practice
- /assessment/personality -> personality assessment
- /assessment/technical -> technical assessment
- /assessment/technical/attempt -> technical attempt view
- /assessment/results -> assessment results
- /assessment/test -> assessment test page

### Non-Routed Or Legacy Files

- app/landing.jsx exists as an alternate landing component, but it is not the active route entry

## 6. API Surface

### Contact And Diagnostics

- app/api/contact/route.js -> contact form email delivery through Nodemailer and SMTP
- app/api/check-config/route.js -> environment/config diagnostics
- app/api/debug-auth/route.js -> auth debugging endpoint

### Jobs And Saved Jobs

- app/api/jobs/route.js -> Remotive job search proxy with filters
- app/api/saved-jobs/route.js -> saved-jobs CRUD backed by Supabase and user auth

### LinkedIn Integration

- app/api/linkedin/auth-url/route.js -> fetches LinkedIn auth URL from backend service
- app/api/linkedin/exchange-code/route.js -> exchanges LinkedIn auth code through backend service
- app/api/linkedin/post-direct/route.js -> sends direct post payload to backend service

### Resume Handling

- app/api/resume/upload/route.js -> resume upload proxy, with backend URL fallback
- app/api/resume/upload-fastapi/route.js -> alternate FastAPI upload path
- app/api/resume/signed-url/route.js -> signed URL generation for storage access

### Payments

- app/api/payment/create-order/route.js -> creates Razorpay orders
- app/api/payment/verify/route.js -> verifies Razorpay signatures and payment result

### Assessment Proxies

- app/api/assessment/general_aptitude/route.js
- app/api/assessment/communication_test/route.js
- app/api/assessment/personality_assessment/route.js
- app/api/assessment/technical_assessment/route.js
- app/api/assessment/ats_score/route.js
- app/api/assessment/linkedin_post/route.js
- app/api/assessment/resume_optimize/route.js

Most assessment routes forward requests to a Python/FastAPI backend using BACKEND_API_URL or NEXT_PUBLIC_API_URL.

## 7. Shared App Architecture

### Root And Layout

- app/layout.js mounts AuthProvider and ProfileProvider
- app/layout.js uses Geist font families
- app/layout.js defaults the document to dark mode
- app/globals.css defines custom scrollbar styling, cursor-loading behavior, and global color variables

### Home Page Composition

- app/page.jsx renders the hero section and composes these sections:
  - app/components/FeaturesSection.jsx
  - app/components/ScenariosSection.jsx
  - app/components/WhySection.jsx
  - app/components/TestimonialsSection.jsx
  - app/components/FAQSection.jsx
  - app/components/ContactSection.jsx
  - app/components/Footer.jsx

### Dashboard Composition

- app/dashboard/page.jsx is a client-side shell that:
  - checks auth state
  - redirects unauthenticated users to /login
  - redirects admins to /admin
  - redirects unconfirmed users to /verify-otp
  - redirects non-onboarded users to /onboarding
  - renders tabbed dashboard content

The dashboard tabs include overview, assessment, progress, history, subscription, referral, profile, job search, LinkedIn optimizer, and LinkedIn post generation.

### Contexts

- app/context/AuthContext.jsx manages Supabase auth state, user caching, and session refresh
- app/context/ProfileContext.jsx tracks avatar/profile image state
- app/context/ThemeContext.jsx persists light/dark theme preference

### Hooks

- app/hooks/useSupabase.js provides Supabase helpers
- app/hooks/useCache.js provides request caching/debouncing utilities
- app/hooks/useSearch.js provides search and API helper logic

### Utilities

- utils/actions.js contains server actions for sign-in, sign-up, reset-password, OTP, and OAuth flows
- utils/profileUtils.js contains name initials, avatar lookup, display-name helpers, and loading-cursor helpers
- utils/resumeStorage.js handles resume persistence logic
- utils/assessmentDataStore.js stores assessment data
- utils/getInitialFromName.js exports initials helper
- utils/questionPools.js currently appears empty
- utils/supabase/client.js and utils/supabase/server.js create browser and server Supabase clients

## 8. External Integrations

- Supabase auth with PKCE flow
- Supabase storage and database tables such as saved_jobs and user_onboarding
- Razorpay checkout on the payment page and verification route
- Nodemailer SMTP emails for contact and password-reset flows
- Remotive remote jobs API
- External Python/FastAPI backend for AI assessment and resume endpoints
- LinkedIn backend integration for auth URL, code exchange, and post generation

## 9. Testing And Documentation Tooling

- Vitest config exists in both vitest.config.js and vitest.config.mjs
- tests/ includes Home, Navbar, ContactSection, contact API, and getInitialFromName tests
- Storybook is configured and has Button, Header, and Page stories
- test-runner.js references Storybook-related test behavior
- package.json includes dev, build, start, test, test:watch, test:ui, test:coverage, storybook, and build-storybook scripts

## 10. Deployment Signals

- vercel.json indicates Vercel deployment support for the Next.js app
- runtime.txt indicates Python 3.11 for the backend side
- deploy_railway.py suggests Railway deployment orchestration for the Python service
- check-env.js is a local environment validation utility

## 11. Database And Schema Assets

- saved_jobs_table.sql exists at the repo root
- model/ contains multiple SQL/schema files such as database_setup.sql, database_migration.sql, database_migration_fixed.sql, database_enhancements.sql, and enhanced_database_schema.sql

## 12. Important Implementation Notes

- The codebase is JavaScript-first, not TypeScript-first, despite README text suggesting TypeScript readiness
- app/page.jsx is the actual landing page, while app/landing.jsx looks like a legacy alternate implementation
- app/components/PricingSection.jsx exists, but it is not currently composed into app/page.jsx
- app/auth/page.jsx and app/landing.jsx both refer to /homepage, but no /homepage route exists
- app/admin/page.jsx is explicitly demo code and uses localStorage for user management
- app/auth/linkedin/callback/page.jsx stores LinkedIn access data in localStorage
- payment routes and payment page contain hard-coded Razorpay keys/secrets in the current snapshot
- .storybook/main.js appears to use a Windows-style static path that may not work correctly on macOS/Linux
- README.md contains several aspirational items that do not match the current codebase exactly, so Claude should trust implementation files over README claims

## 13. AI Reading Order Recommendation

If another model is going to inspect the repository, the highest-value reading order is:

1. package.json
2. app/layout.js
3. app/page.jsx
4. app/dashboard/page.jsx
5. app/context/AuthContext.jsx
6. utils/actions.js
7. app/api/payment/create-order/route.js and app/api/payment/verify/route.js
8. app/api/assessment/* routes
9. app/api/linkedin/* routes
10. app/components/* sections and dashboard components

## 14. Short Summary For Claude

TALENTO-AI is a Next.js 15 App Router application for interview prep, resume optimization, assessments, job search, payments, and LinkedIn tools. It relies heavily on Supabase, a separate Python/FastAPI backend, and Razorpay. The biggest things to inspect carefully are auth flow correctness, payment secret handling, backend proxy boundaries, and route consistency.