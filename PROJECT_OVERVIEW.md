# TalentoAI - AI-Powered Job Interview Preparation Platform

## 🚀 Project Overview

TalentoAI is a comprehensive AI-powered platform designed to revolutionize job interview preparation and professional development. Built with modern web technologies, it provides users with intelligent coaching, resume optimization, assessment practice, and job search capabilities.

## ✨ Key Features

### 🤖 AI-Powered Assessment System
- **Technical Assessments**: Programming challenges and technical evaluations
- **Aptitude Tests**: Logic and reasoning assessments  
- **Communication Skills**: Verbal and written communication evaluation
- **Personality Assessment**: Behavioral analysis and insights
- **Real-time Feedback**: Instant AI-generated performance analysis

### 📄 Resume Intelligence
- **Resume Upload & Analysis**: AI-powered resume parsing and optimization
- **ATS Score Analysis**: Applicant Tracking System compatibility scoring
- **Smart Recommendations**: Personalized improvement suggestions
- **Version History**: Track resume changes and improvements over time

### 💼 Job Search & Management
- **Smart Job Search**: AI-curated job recommendations
- **Job Saving**: Bookmark and organize job opportunities  
- **Application Tracking**: Monitor application status and progress
- **LinkedIn Integration**: Professional network connectivity

### 📊 Progress Analytics
- **Performance Dashboard**: Comprehensive progress tracking
- **Skill Development Charts**: Visual representation of improvement areas
- **Assessment History**: Detailed records of all completed assessments
- **Personalized Insights**: Data-driven recommendations for growth

### 💳 Payment & Subscription
- **Razorpay Integration**: Secure payment processing
- **Flexible Plans**: Multiple subscription tiers
- **Usage Tracking**: Monitor feature usage and limits

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.4.1** - React framework with App Router
- **React 19.1.0** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Advanced animations and transitions
- **Chart.js & React-Chart.js-2** - Data visualization
- **Heroicons & React Icons** - Icon libraries
- **SWR** - Data fetching and caching

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - User authentication and authorization
- **Row Level Security (RLS)** - Data security policies
- **Real-time subscriptions** - Live data updates

### Development Tools
- **Vitest** - Modern testing framework
- **Storybook** - Component development and documentation
- **ESLint & Prettier** - Code quality and formatting
- **GitHub Actions** - CI/CD pipeline

### External Integrations
- **Razorpay** - Payment processing
- **NodeMailer** - Email services
- **LinkedIn API** - Professional networking
- **External Assessment APIs** - Third-party evaluation services

## 📁 Project Structure

```
talento-ai/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── assessment/           # Assessment endpoints
│   │   ├── jobs/                 # Job search APIs
│   │   ├── payment/              # Payment processing
│   │   ├── resume/               # Resume handling
│   │   └── saved-jobs/           # Job bookmarking
│   ├── assessment/               # Assessment pages
│   │   ├── aptitude/
│   │   ├── communication/
│   │   ├── personality/
│   │   ├── results/
│   │   └── technical/
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # User dashboard
│   │   └── components/           # Dashboard components
│   ├── components/               # Shared UI components
│   └── context/                  # React contexts
├── utils/                        # Utility functions
│   └── supabase/                 # Supabase configuration
├── Models/                       # AI/ML model assets
├── tests/                        # Test files
└── stories/                      # Storybook stories
```

## 🗄️ Database Schema

### Core Tables
- **users** - User profiles and metadata
- **resumes** - Resume documents and versions  
- **resume_analyses** - AI analysis results
- **saved_jobs** - User bookmarked jobs
- **assessments** - Assessment records and scores
- **payments** - Transaction history
- **user_progress** - Skill development tracking

### Security Features
- Row Level Security (RLS) policies
- User-based data isolation
- Authenticated API endpoints
- Secure file storage

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Razorpay account (for payments)

### Installation
```bash
# Clone the repository
git clone https://github.com/Krishilgithub/TALENTO-AI.git
cd TALENTO-AI

# Install dependencies  
npm install

# Set up environment variables
cp .env.example .env.local
# Configure Supabase credentials; paid subscriptions are currently unavailable.

# Run the development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
```

## 📈 Current Status

### ✅ Completed Features
- User authentication and authorization
- Resume upload and AI analysis
- Job search with external API integration
- Assessment system (Technical, Aptitude, Communication, Personality)
- Dashboard with progress tracking
- Paid subscriptions are currently unavailable
- LinkedIn OAuth integration
- Saved jobs functionality
- Responsive UI with dark/light themes

### 🔧 Development Features
- Comprehensive test suite with Vitest
- Storybook component documentation
- CI/CD pipeline with GitHub Actions
- Type-safe development with TypeScript
- Modern React patterns and hooks

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## 📖 Storybook

```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## 🚀 Deployment

The application is configured for deployment on Vercel with automatic deployments from the main branch.

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support

For support and questions, please contact the development team or open an issue in the repository.

---

**TalentoAI** - Empowering careers through AI-driven preparation and insights.