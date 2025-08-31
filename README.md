# Perleap - AI-Powered Educational Assessment Platform

## Overview

Perleap is a comprehensive educational platform that revolutionizes student assessment through AI-powered conversations and adaptive learning analytics. Built for modern educators, it provides deep insights into both soft skills and academic abilities through natural, engaging interactions.

## 🚀 Key Features

### For Teachers
- **Comprehensive Assessment**: Evaluate students through AI-powered conversations that reveal insights into critical thinking, creativity, and social skills
- **Real-time Analytics**: Monitor student progress with SRA (Student Response Analysis) and CRA (Content-Related Abilities) metrics
- **Course Management**: Create and manage courses with custom learning objectives and activities
- **Activity Builder**: Design engaging learning activities including assessments, training modules, and AI chat interactions
- **Student Insights**: Access detailed dashboards with actionable progress data and personalized recommendations

### For Students
- **Interactive Learning**: Engage in natural conversations with AI tutors that adapt to individual learning styles
- **Personalized Pathways**: Receive customized learning experiences based on unique strengths and challenges
- **Progress Tracking**: Monitor personal growth across multiple skill dimensions
- **Immediate Feedback**: Get instant, constructive feedback on performance and learning outcomes

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Routing**: React Router v6
- **Type Safety**: TypeScript throughout

### Backend
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access control
- **API**: Supabase Edge Functions for AI processing
- **Real-time**: Supabase real-time subscriptions for live updates

### AI Integration
- **LLM Provider**: OpenAI GPT models for conversational assessment
- **Assessment Types**: SRA (Student Response Analysis) and CRA (Content-Related Abilities) 
- **Adaptive Engine**: AI-powered recommendation system for personalized learning paths

## 📊 Data Model

### Core Entities

#### Courses
```sql
- id: UUID (Primary Key)
- teacher_id: UUID (Foreign Key to profiles)
- title: TEXT
- subject: TEXT  
- grade_level: TEXT
- description: TEXT
- cra_table: JSONB (Content-Related Abilities matrix)
- status: TEXT (active/archived)
```

#### Activities
```sql
- id: UUID (Primary Key)
- course_id: UUID (Foreign Key to courses)
- title: TEXT
- type: TEXT (Assessment/Training/Student-Chat/Collaboration/Innovation)
- goal: TEXT
- difficulty: TEXT (adaptive/easy/hard)
- config: JSONB (activity configuration)
- steps: JSONB (activity steps)
- status: TEXT (draft/published/archived)
```

#### Activity Runs
```sql
- id: UUID (Primary Key)
- activity_id: UUID (Foreign Key to activities)
- student_id: UUID (Foreign Key to profiles) 
- status: TEXT (created/in_progress/completed/failed)
- messages: JSONB (conversation history)
- response_time_ms: INTEGER
- relaxation_time_ms: INTEGER
```

#### Assessment Snapshots
```sql
-- SRA Snapshots (Student Response Analysis)
- student_id: UUID
- course_id: UUID
- dimension: TEXT (Vision/Values/Thinking/Connection/Action)
- d_score: INTEGER (1-100)
- m_score: INTEGER (1-100) 
- progression: TEXT (Up/Down)
- level_percent: INTEGER (0-100)
- commentary: TEXT

-- CRA Snapshots (Content-Related Abilities)
- student_id: UUID
- course_id: UUID
- area: TEXT (subject area)
- ks_component: TEXT (knowledge/skill component)
- cl_percent: INTEGER (0-100, Competency Level)
- ac_commentary: TEXT (Assessment Commentary)
```

## 🔐 Security & Access Control

### Row-Level Security (RLS) Policies
- **Teachers**: Can manage their own courses, activities, and view student data within their courses
- **Students**: Can view and interact with enrolled courses and their own assessment data
- **Data Isolation**: Strict user-based data access with comprehensive RLS policies

### Authentication Flow
- Email/password authentication via Supabase Auth
- Role-based redirects (teacher → dashboard, student → learning portal)
- Automatic profile creation with user metadata
- Session persistence with auto-refresh tokens

## 🎨 Design System

### Color Palette
- **Primary**: Fluid blue-to-purple gradient (#4F46E5 → #7C3AED)
- **Secondary**: Warm purple (#A855F7)
- **Success**: Educational green (#10B981)
- **Warning**: Attention orange (#F59E0B)

### Key Design Principles
- **Fluid Gradients**: Dynamic color transitions that feel modern and engaging
- **Semantic Tokens**: All colors defined through CSS custom properties for consistency
- **Responsive Design**: Mobile-first approach with fluid typography and spacing
- **Accessibility**: High contrast ratios and semantic HTML throughout

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd perleap
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Add your Supabase project credentials
```

4. **Database Setup**
The database schema is automatically created through Supabase migrations. The system includes:
- User profiles and role management
- Course and activity structures
- Assessment snapshot tables
- Real-time subscriptions for live updates

5. **Start Development Server**
```bash
npm run dev
```

### AI Integration Setup

1. **OpenAI API Key**
Configure your OpenAI API key in Supabase Edge Functions for AI-powered assessments.

2. **Assessment Operators**
The system includes several AI operators:
- `assess_sra`: Evaluates student responses across five dimensions
- `assess_cra`: Analyzes content-related abilities
- `feedback`: Generates personalized student feedback
- `recommend`: Creates adaptive learning recommendations

## 📱 User Workflows

### Teacher Workflow
1. **Account Creation** → Role selection as teacher
2. **Course Setup** → Title, subject, grade level, learning objectives
3. **Activity Design** → Create assessments, conversations, and training modules
4. **Student Enrollment** → Add students to courses
5. **Progress Monitoring** → View real-time analytics and insights
6. **Feedback Delivery** → Review AI-generated assessments and provide guidance

### Student Workflow
1. **Account Creation** → Role selection as student
2. **Course Enrollment** → Join teacher-created courses
3. **Activity Participation** → Engage in AI conversations and assessments
4. **Progress Tracking** → Monitor personal growth and achievements
5. **Feedback Review** → Receive and act on personalized recommendations

## 🔧 Development Notes

### Key Components
- `HeroSection`: Landing page hero with gradient background
- `TeacherDashboard`: Comprehensive teacher analytics and course management
- `StudentDashboard`: Student progress tracking and activity access
- `CourseCreation`: Multi-step course creation wizard
- `StudentChat`: AI-powered conversational assessment interface

### Database Interactions
- All database operations use Supabase client with built-in RLS
- Real-time subscriptions for live progress updates
- Optimistic updates for smooth user experience

### AI Processing
- Edge Functions handle AI model interactions
- Streaming responses for real-time conversation flow
- Structured assessment outputs with validation schemas

## 🚀 Deployment

### Recommended Stack
- **Frontend**: Vercel (automatic deployments from Git)
- **Backend**: Supabase (managed PostgreSQL + Edge Functions)
- **Domain**: Custom domain configuration through Vercel
- **Monitoring**: Built-in Supabase analytics and logging

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📈 Future Enhancements

- **Multi-language Support**: Internationalization for global reach
- **Advanced Analytics**: Machine learning insights for learning patterns
- **Mobile App**: Native iOS/Android applications
- **Integration APIs**: Connect with popular LMS platforms
- **Parent Portal**: Family engagement and progress sharing
- **Accessibility Features**: Enhanced support for diverse learning needs

## 🤝 Contributing

This project follows modern React and TypeScript best practices. Key guidelines:
- Use TypeScript for all new code
- Follow the established design system patterns
- Maintain comprehensive RLS policies for data security
- Write descriptive commit messages
- Test authentication flows thoroughly

## 📄 License

Copyright © 2024 Perleap. All rights reserved.

---

## 🏗️ Architecture Decisions

### Why Supabase?
- **Real-time Capabilities**: Essential for live progress tracking
- **Built-in Authentication**: Reduces security complexity
- **Row-Level Security**: Granular data access control
- **Edge Functions**: Serverless AI processing
- **PostgreSQL**: Robust relational data model

### Why React + TypeScript?
- **Type Safety**: Reduces runtime errors in educational context
- **Component Reusability**: Consistent UI across teacher/student experiences  
- **Performance**: Optimized rendering for data-heavy dashboards
- **Ecosystem**: Rich library support for educational features

### Design Philosophy
- **Human-Centered**: AI enhances rather than replaces human judgment
- **Privacy-First**: Student data protection as core principle
- **Accessibility**: Inclusive design for diverse learning needs
- **Scalability**: Architecture supports growth from classroom to district level

---

*Built with ❤️ for educators who believe every student deserves personalized learning experiences.*