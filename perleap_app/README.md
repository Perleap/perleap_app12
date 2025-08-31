# PerLeap - AI-Powered Educational Platform

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.55.0-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC.svg)](https://tailwindcss.com/)

PerLeap is an innovative AI-powered educational platform that implements the Quantum Education Doctrine, providing personalized learning experiences through comprehensive assessment of both Soft-Related Abilities (SRA) and Content-Related Abilities (CRA).

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Supabase** account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd perleap_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Add your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   ```bash
   # Install Supabase CLI (if not already installed)
   npm install -g supabase
   
   # Link to your Supabase project
   supabase link --project-ref your_project_ref
   
   # Run database migrations
   supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:8080`

## 🎯 Features

### For Teachers

- **📊 Comprehensive Dashboard**: Monitor student progress across all courses
- **📚 Course Management**: Create and configure courses with CRA assessment tables
- **🎯 Activity Creation**: Design AI-powered learning activities
- **📈 Analytics**: Real-time SRA and CRA progress tracking
- **👥 Student Management**: Enroll students and track individual progress

### For Students

- **🎓 Personalized Learning**: AI-adapted learning pathways
- **💬 Interactive Chat**: Socratic dialogue with AI tutors
- **📊 Progress Tracking**: Visual SRA dimension progress
- **🎯 Adaptive Assessments**: Dynamic difficulty adjustment
- **🏆 Achievement System**: Gamified learning experience

### Core Capabilities

- **SRA Assessment**: Vision, Values, Thinking, Connection, Action dimensions
- **CRA Analytics**: Content-related ability tracking
- **AI-Powered Chat**: Intelligent tutoring conversations
- **Real-time Progress**: Live updates and analytics
- **Responsive Design**: Works on all devices

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack Query
- **Routing**: React Router DOM

### Project Structure

```
perleap_app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   ├── lib/                # Utility functions
│   ├── pages/              # Route components
│   └── assets/             # Static assets
├── supabase/               # Database migrations
└── public/                 # Public assets
```

## 📖 Usage Guide

### Getting Started as a Teacher

1. **Sign Up**: Create an account with the "teacher" role
2. **Create a Course**: Use the course creation wizard
3. **Configure CRA Table**: Set up content-related assessments
4. **Add Activities**: Create learning activities and assessments
5. **Enroll Students**: Invite students to your course
6. **Monitor Progress**: Track student performance in real-time

### Getting Started as a Student

1. **Sign Up**: Create an account with the "student" role
2. **Join Courses**: Enroll in available courses
3. **Complete SRA Assessment**: Initial soft skills evaluation
4. **Engage in Activities**: Participate in AI-powered learning sessions
5. **Track Progress**: Monitor your learning journey
6. **Receive Recommendations**: Get personalized learning suggestions

### Key Concepts

#### SRA (Soft-Related Abilities)
- **Vision**: Goal-setting and future planning
- **Values**: Personal beliefs and principles
- **Thinking**: Critical and creative thinking
- **Connection**: Interpersonal and communication skills
- **Action**: Initiative and execution abilities

#### CRA (Content-Related Abilities)
- Subject-specific knowledge assessment
- Adaptive curriculum recommendations
- Progress tracking across learning areas
- Personalized content delivery

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

### Database Schema

The application uses the following core tables:

- **profiles**: User information and roles
- **courses**: Course definitions and metadata
- **activities**: Learning activities and configurations
- **activity_runs**: Student progress tracking
- **sra_snapshots**: Soft-related ability assessments
- **cra_snapshots**: Content-related ability assessments
- **course_enrollments**: Student-course relationships

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# The built files will be in the `dist/` directory
```

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Build and deploy
npm run build
# Upload dist/ folder to Netlify
```

#### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

## 🔒 Security

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Teacher/student permission separation
- **Input Validation**: Client and server-side validation
- **HTTPS**: Encrypted data transmission

## 📊 Analytics & Monitoring

- **Real-time Progress Tracking**: Live student performance monitoring
- **Learning Analytics**: SRA/CRA progression analysis
- **Performance Metrics**: Application performance monitoring
- **Error Tracking**: Comprehensive error logging

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Ensure all tests pass
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

#### Database Connection Issues
- Verify Supabase credentials in environment variables
- Check if database migrations have been applied
- Ensure RLS policies are properly configured

#### Authentication Problems
- Clear browser cache and local storage
- Verify email confirmation (if required)
- Check Supabase Auth settings

#### Build Errors
- Ensure Node.js version is 18+
- Clear node_modules and reinstall dependencies
- Check for TypeScript compilation errors

### Getting Help

- **Documentation**: Check the [DOCUMENTATION.md](DOCUMENTATION.md) file
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🔮 Roadmap

### Upcoming Features

- [ ] Real-time collaboration tools
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Third-party integrations
- [ ] Offline support
- [ ] Multi-language support

### Technical Improvements

- [ ] Performance optimization
- [ ] Enhanced accessibility
- [ ] Comprehensive testing suite
- [ ] CI/CD pipeline automation

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Shadcn/ui** for the beautiful component library
- **Vite** for the fast build tool
- **React** team for the amazing framework

---

**PerLeap** - Transforming education through AI-powered personalized learning.

*Built with ❤️ for the future of education*
