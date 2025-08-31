# PerLeap Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Features](#features)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Integration](#api-integration)
7. [Component Structure](#component-structure)
8. [Routing](#routing)
9. [State Management](#state-management)
10. [Styling & UI](#styling--ui)
11. [Development Setup](#development-setup)
12. [Deployment](#deployment)

## Overview

PerLeap is an AI-powered educational platform that implements the Quantum Education Doctrine, focusing on personalized learning through comprehensive assessment of both Soft-Related Abilities (SRA) and Content-Related Abilities (CRA). The platform provides separate interfaces for teachers and students, enabling adaptive learning experiences with real-time progress tracking.

### Key Concepts

- **SRA (Soft-Related Abilities)**: Assessment of Vision, Values, Thinking, Connection, and Action dimensions
- **CRA (Content-Related Abilities)**: Subject-specific knowledge and skills assessment
- **Perleaps**: Individual learning activities that adapt to student progress
- **Quantum Education Doctrine**: AI-driven personalized learning methodology

## Architecture

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation

### Project Structure

```
perleap_app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   └── ...             # Custom components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client and types
│   ├── lib/                # Utility functions
│   ├── pages/              # Route components
│   └── assets/             # Static assets
├── supabase/               # Database migrations and config
└── public/                 # Public assets
```

## Database Schema

### Core Tables

#### `profiles`
- **Purpose**: User profile information
- **Key Fields**: `user_id`, `email`, `full_name`, `role`
- **Roles**: `teacher`, `student`

#### `courses`
- **Purpose**: Course definitions created by teachers
- **Key Fields**: `teacher_id`, `title`, `subject`, `grade_level`, `cra_table`
- **Status**: `draft`, `active`, `archived`

#### `activities`
- **Purpose**: Learning activities within courses
- **Types**: `Assessment`, `Training`, `Student-Chat`, `Collaboration`, `Innovation`
- **Key Fields**: `course_id`, `title`, `type`, `config`, `steps`

#### `activity_runs`
- **Purpose**: Student progress tracking for activities
- **Key Fields**: `activity_id`, `student_id`, `messages`, `status`
- **Status**: `not_started`, `in_progress`, `completed`, `abandoned`

#### `sra_snapshots`
- **Purpose**: SRA assessment results
- **Dimensions**: Vision, Values, Thinking, Connection, Action
- **Key Fields**: `dimension`, `d_score`, `m_score`, `progression`, `level_percent`

#### `cra_snapshots`
- **Purpose**: CRA assessment results
- **Key Fields**: `area`, `ks_component`, `cl_percent`, `ac_commentary`

#### `course_enrollments`
- **Purpose**: Student enrollment in courses
- **Key Fields**: `course_id`, `student_id`

### Row Level Security (RLS)

All tables implement RLS policies ensuring:
- Users can only access their own data
- Teachers can manage their courses and view student progress
- Students can only access enrolled courses and their own data

## Features

### Teacher Features

1. **Dashboard**
   - Overview of all courses and students
   - Real-time progress monitoring
   - SRA and CRA analytics
   - Recent activity tracking

2. **Course Management**
   - Create and configure courses
   - Set up CRA assessment tables
   - Manage course enrollments
   - Monitor student progress

3. **Activity Creation**
   - Design learning activities
   - Configure AI chat interactions
   - Set learning objectives and steps
   - Define assessment criteria

### Student Features

1. **Learning Dashboard**
   - View enrolled courses
   - Track SRA progress across dimensions
   - Monitor activity completion
   - Access personalized recommendations

2. **Interactive Activities**
   - AI-powered chat sessions
   - Adaptive assessments
   - Real-time feedback
   - Progress tracking

3. **Progress Analytics**
   - SRA dimension scores
   - CRA subject mastery
   - Learning trajectory visualization
   - Achievement tracking

## Authentication & Authorization

### Authentication Flow

1. **Sign Up**: Users register with email/password and role selection
2. **Sign In**: Email/password authentication via Supabase Auth
3. **Profile Creation**: Automatic profile creation on signup
4. **Session Management**: Persistent sessions with auto-refresh

### Authorization

- **Role-based Access**: Teachers and students have different permissions
- **Protected Routes**: Route-level protection based on user role
- **Data Access**: RLS policies enforce data access rules

### Security Features

- Row Level Security (RLS) on all database tables
- JWT-based authentication
- Automatic session refresh
- Secure password handling

## API Integration

### Supabase Integration

```typescript
// Client configuration
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Key Operations

- **Authentication**: Sign up, sign in, sign out
- **Profile Management**: Fetch and update user profiles
- **Course Operations**: CRUD operations for courses
- **Activity Management**: Create and manage learning activities
- **Progress Tracking**: Record and retrieve student progress
- **Assessment Data**: Store and retrieve SRA/CRA snapshots

## Component Structure

### Core Components

#### `Navigation`
- Responsive navigation bar
- Role-based menu items
- User profile display

#### `DashboardCard`
- Reusable metric display component
- Supports icons, trends, and values
- Responsive design

#### `ProtectedRoute`
- Route protection based on authentication and role
- Automatic redirects for unauthorized access

#### `HeroSection`
- Landing page hero component
- Call-to-action elements

### UI Components (Shadcn/ui)

- **Form Components**: Input, Select, Textarea, etc.
- **Layout Components**: Card, Dialog, Sheet, etc.
- **Feedback Components**: Toast, Alert, Progress, etc.
- **Navigation Components**: Tabs, Breadcrumb, etc.

## Routing

### Route Structure

```
/                           # Landing page
/auth                       # Authentication page
/teacher                    # Teacher dashboard
/teacher/courses            # Course management
/teacher/courses/new        # Course creation
/student                    # Student dashboard
/student/courses            # Enrolled courses
/student/activity/:id       # Activity interface
/*                          # 404 page
```

### Route Protection

- **Public Routes**: `/`, `/auth`
- **Teacher Routes**: `/teacher/*`
- **Student Routes**: `/student/*`
- **Protected Routes**: All teacher and student routes

## State Management

### React Query (TanStack Query)

- **Server State**: Manages API data fetching and caching
- **Optimistic Updates**: Immediate UI updates with background sync
- **Error Handling**: Centralized error management
- **Loading States**: Automatic loading state management

### Local State

- **React Hooks**: useState, useEffect for component state
- **Custom Hooks**: useAuth, useMobile for reusable logic
- **Context**: AuthContext for global authentication state

## Styling & UI

### Design System

- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Component library built on Radix UI
- **Custom Theme**: Extended color palette and design tokens
- **Responsive Design**: Mobile-first approach

### Key Design Features

- **Gradient Backgrounds**: Modern gradient cards and buttons
- **Shadow System**: Consistent shadow hierarchy
- **Color Palette**: Semantic color system
- **Typography**: Consistent font hierarchy
- **Spacing**: Systematic spacing scale

### Custom CSS Classes

```css
/* Gradient backgrounds */
.bg-gradient-hero
.bg-gradient-card

/* Shadow system */
.shadow-medium
.shadow-strong
.shadow-glow

/* Custom animations */
.hover:scale-110
.transition-all
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Database Setup

1. **Supabase Project**: Create new Supabase project
2. **Migrations**: Run database migrations
3. **RLS Policies**: Verify Row Level Security setup
4. **Auth Configuration**: Configure authentication settings

## Deployment

### Build Process

1. **Development Build**: `npm run build:dev`
2. **Production Build**: `npm run build`
3. **Static Assets**: Optimized for CDN delivery

### Deployment Options

- **Vercel**: Recommended for React applications
- **Netlify**: Static site hosting
- **Supabase Edge Functions**: Backend API deployment
- **Docker**: Containerized deployment

### Environment Configuration

- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Live application deployment

### Performance Optimization

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **Caching**: Browser and CDN caching strategies

## Security Considerations

### Data Protection

- **Encryption**: All data encrypted in transit and at rest
- **Authentication**: Secure JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Client and server-side validation

### Privacy Compliance

- **GDPR**: Data protection and user rights
- **FERPA**: Educational privacy compliance
- **Data Retention**: Configurable data retention policies
- **User Consent**: Explicit consent for data processing

## Monitoring & Analytics

### Error Tracking

- **Error Boundaries**: React error boundary implementation
- **Logging**: Structured logging for debugging
- **Performance Monitoring**: Core Web Vitals tracking

### Analytics

- **User Engagement**: Activity and progress tracking
- **Learning Analytics**: SRA/CRA progression analysis
- **System Performance**: Application performance metrics

## Future Enhancements

### Planned Features

- **Real-time Collaboration**: Live student-teacher interactions
- **Advanced Analytics**: Machine learning insights
- **Mobile Application**: Native mobile app development
- **Integration APIs**: Third-party educational tool integration
- **Offline Support**: Offline activity completion
- **Multi-language Support**: Internationalization

### Technical Improvements

- **Performance Optimization**: Advanced caching strategies
- **Accessibility**: WCAG 2.1 compliance
- **Testing**: Comprehensive test coverage
- **CI/CD**: Automated deployment pipelines
