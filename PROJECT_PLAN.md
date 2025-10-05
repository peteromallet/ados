# ADOS Event Management Platform - Project Plan

## Overview

A multi-event management platform that allows users to sign in with Discord via Supabase Auth and apply to attend various ADOS events. Each event can have its own custom questionnaire that attendees must complete during registration.

## Tech Stack

- **Framework**: Next.js 14+ (App Router with TypeScript)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth with Discord OAuth
- **Database**: Supabase PostgreSQL
- **Deployment**: Railway.com
- **Additional Libraries**:
  - `@supabase/ssr` - Server-side Supabase integration
  - `@supabase/supabase-js` - Supabase client
  - `framer-motion` - Smooth animations (optional)
  - `lucide-react` - Icons

## Database Schema

### Tables

```sql
-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_username TEXT,
  discord_id TEXT UNIQUE,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  description TEXT,
  long_description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  max_attendees INTEGER,
  is_active BOOLEAN DEFAULT true,
  banner_image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table (per event)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text', -- text, textarea, multiple_choice, etc.
  options JSONB, -- For multiple choice questions
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance/Applications table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, waitlist
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(user_id, event_id) -- User can only apply once per event
);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attendance_id, question_id)
);

-- Indexes for performance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_questions_event_id ON questions(event_id);
CREATE INDEX idx_answers_attendance_id ON answers(attendance_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_is_active ON events(is_active);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Events: Everyone can read active events
CREATE POLICY "Active events are viewable by everyone"
  ON events FOR SELECT USING (is_active = true);

-- Questions: Everyone can read questions for active events
CREATE POLICY "Questions are viewable for active events"
  ON questions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = questions.event_id 
      AND events.is_active = true
    )
  );

-- Attendance: Users can read their own attendance, insert their own
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attendance"
  ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Answers: Users can read/write their own answers
CREATE POLICY "Users can view own answers"
  ON answers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance 
      WHERE attendance.id = answers.attendance_id 
      AND attendance.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own answers"
  ON answers FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance 
      WHERE attendance.id = answers.attendance_id 
      AND attendance.user_id = auth.uid()
    )
  );
```

## Application Architecture

### Project Structure

```
/ados
├── app/
│   ├── layout.tsx                 # Root layout with Supabase provider
│   ├── page.tsx                   # Landing page / Home
│   ├── globals.css                # Global styles
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx          # Sign in page
│   │   ├── callback/
│   │   │   └── route.ts          # OAuth callback handler
│   │   └── signout/
│   │       └── route.ts          # Sign out handler
│   ├── events/
│   │   ├── page.tsx              # Events list page
│   │   └── [slug]/
│   │       ├── page.tsx          # Event details
│   │       └── apply/
│   │           └── page.tsx      # Event application/questionnaire
│   ├── dashboard/
│   │   └── page.tsx              # User dashboard (their applications)
│   ├── success/
│   │   └── page.tsx              # Application success page
│   └── api/
│       └── attendance/
│           └── route.ts          # API endpoint for submitting attendance
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ProgressBar.tsx
│   ├── Hero.tsx                  # Landing page hero section
│   ├── SignInButton.tsx          # Discord sign-in button
│   ├── EventCard.tsx             # Event preview card
│   ├── EventList.tsx             # List of events
│   ├── Questionnaire.tsx         # Multi-step questionnaire
│   ├── QuestionStep.tsx          # Individual question component
│   ├── Navigation.tsx            # Top navigation bar
│   └── AuthProvider.tsx          # Auth context provider
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── middleware.ts         # Supabase middleware
│   ├── database/
│   │   ├── events.ts             # Event queries
│   │   ├── attendance.ts         # Attendance queries
│   │   ├── profiles.ts           # Profile queries
│   │   └── questions.ts          # Question queries
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
├── hooks/
│   ├── useAuth.ts                # Auth state hook
│   ├── useEvent.ts               # Event data hook
│   └── useAttendance.ts          # Attendance data hook
├── middleware.ts                 # Next.js middleware for auth
├── public/
│   ├── banodoco-logo.svg
│   └── images/
├── supabase/
│   ├── migrations/               # Database migrations
│   └── seed.sql                  # Seed data for testing
├── .env.local                    # Environment variables
├── .env.example                  # Example env file
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## User Flows

### 1. First-Time Visitor Flow

```
Landing Page (/)
  ↓
Click "Apply To Join"
  ↓
Redirect to /events (Events List)
  ↓
Click on specific event
  ↓
Event Details Page (/events/[slug])
  ↓
Click "Apply to this Event"
  ↓
Check Auth Status
  ↓ (Not authenticated)
Sign In Page (/auth/signin)
  ↓
Click "Sign in with Discord"
  ↓
Discord OAuth Flow
  ↓
Callback (/auth/callback)
  ↓ (Create/update profile)
Redirect to /events/[slug]/apply
  ↓
Multi-step Questionnaire
  ↓ (Answer each question)
Submit Application
  ↓
Create attendance record + answers
  ↓
Success Page (/success)
```

### 2. Returning User Flow

```
Landing Page (/)
  ↓ (Already authenticated)
Click "Apply To Join"
  ↓
Events List (/events)
  ↓
Select Event
  ↓
Event Details
  ↓
Click "Apply to this Event"
  ↓ (Check if already applied)
If not applied → Questionnaire
If applied → Show status
```

### 3. Dashboard Flow

```
User clicks Dashboard
  ↓
Dashboard Page (/dashboard)
  ↓
View all applications
  - Pending applications
  - Approved applications
  - Event details
  - Application dates
```

## Page Specifications

### Landing Page (`/`)

**Design Elements:**
- Full-screen hero section with background image (similar to provided image)
- Large "ADOS" typography
- Subtitle: "THE EVENT THAT CELEBRATES ART AND OPEN-SOURCE AI"
- "Apply To Join" button (primary CTA)
- "View Events" button (secondary CTA)
- "created by banodoco" footer credit with logo
- Smooth animations on load

**Functionality:**
- If logged in, show user avatar in top-right corner
- CTA buttons redirect to `/events`
- Responsive design for mobile/tablet/desktop

### Events List Page (`/events`)

**Layout:**
- Grid of event cards (3 columns on desktop, 2 on tablet, 1 on mobile)
- Each card shows:
  - Event banner image
  - Event name
  - Date and location
  - Short description
  - Number of applicants (if public)
  - "View Details" button
- Filter options: Upcoming, Past, All
- Search functionality

### Event Details Page (`/events/[slug]`)

**Content:**
- Event banner image
- Event title and metadata (date, location, max attendees)
- Long description
- List of questions to be asked (preview)
- "Apply to this Event" button
- If already applied: Show application status badge
- If event is full: Show waitlist option

### Questionnaire Page (`/events/[slug]/apply`)

**Protected Route**: Requires authentication

**Layout:**
- Progress bar at top (Question X of Y)
- Single question displayed at a time
- Large, clear input field
- "Previous" and "Next" buttons
- "Submit" button on last question
- Smooth transitions between questions

**Question Types:**
- Text input (short answer)
- Textarea (long answer)
- Multiple choice (radio buttons)
- Checkboxes (multiple selection)

**Validation:**
- Required field validation
- Character limits
- Save draft functionality (optional)

### Dashboard Page (`/dashboard`)

**Sections:**
- User profile card (avatar, username, email)
- "My Applications" section:
  - Status badges (Pending, Approved, Rejected, Waitlist)
  - Event name and date
  - Applied date
  - View answers link
- "Upcoming Events" section
- "Past Events" section

### Success Page (`/success`)

**Content:**
- Success icon/animation
- "Application Submitted!" heading
- Confirmation message
- "What happens next?" section
- "View My Applications" button
- "Browse More Events" button

## Authentication Flow

### Supabase + Discord OAuth Setup

1. **Supabase Dashboard:**
   - Enable Discord provider in Authentication settings
   - Add Discord Client ID and Secret
   - Configure redirect URLs

2. **Discord Developer Portal:**
   - Create OAuth2 application
   - Add redirect URL: `https://[your-project].supabase.co/auth/v1/callback`
   - Enable required scopes: `identify`, `email`

3. **Implementation:**
   ```typescript
   // Sign in
   await supabase.auth.signInWithOAuth({
     provider: 'discord',
     options: {
       redirectTo: `${origin}/auth/callback`
     }
   })

   // Callback handler
   // - Exchange code for session
   // - Create/update profile with Discord data
   // - Redirect to intended destination
   ```

### Protected Routes

Use Next.js middleware to protect routes:
- `/events/[slug]/apply`
- `/dashboard`
- Any admin routes (future)

## API Endpoints

### POST `/api/attendance`

Submit attendance application with answers

**Request Body:**
```json
{
  "eventId": "uuid",
  "answers": [
    {
      "questionId": "uuid",
      "answerText": "User's answer"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "attendanceId": "uuid",
  "status": "pending"
}
```

### GET `/api/events/[slug]`

Get event details (optional, can use server components)

### GET `/api/user/attendance`

Get user's attendance records (optional, can use server components)

## Styling Guidelines

### Color Palette

```css
/* Based on the ADOS branding */
--primary: #000000;
--secondary: #ffffff;
--accent-red: #ff4444;
--accent-blue: #4444ff;
--accent-yellow: #ffcc44;
--accent-pink: #ff99cc;
--background: #f5f5f5;
--text-dark: #1a1a1a;
--text-light: #666666;
```

### Typography

- **Headings**: Bold, large, impactful (similar to the ADOS logo style)
- **Body**: Clean, readable sans-serif
- **Spacing**: Generous whitespace, breathing room

### Design Principles

- **Bold & Artistic**: Reflect the creative nature of the event
- **Modern**: Clean lines, smooth animations
- **Accessible**: High contrast, keyboard navigation
- **Responsive**: Mobile-first approach

## Railway Deployment

### Prerequisites

1. Railway account
2. GitHub repository
3. Supabase project

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin [your-repo-url]
   git push -u origin main
   ```

2. **Connect to Railway:**
   - Go to Railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Next.js

3. **Configure Environment Variables:**
   
   In Railway dashboard, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
   NEXT_PUBLIC_APP_URL=https://[your-app].railway.app
   NODE_ENV=production
   ```

4. **Build Configuration:**
   
   Railway should automatically detect Next.js, but ensure:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Node Version: 18+ (specified in package.json)

5. **Domain Setup:**
   - Railway provides a default domain
   - Add custom domain if desired
   - Update Discord OAuth redirect URLs
   - Update Supabase redirect URLs

6. **Database Connection:**
   - No changes needed (Supabase is external)
   - Ensure Supabase allows connections from Railway IPs

### Railway.json Configuration

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
NEXT_PUBLIC_APP_URL=https://[app].railway.app  # Production

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### .env.example

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Seed Data (For Development)

### Sample Event

```sql
INSERT INTO events (name, slug, description, long_description, date, location, max_attendees, is_active)
VALUES (
  'ADOS 2025',
  'ados-2025',
  'The premiere event celebrating art and open-source AI',
  'Join us for a day of workshops, talks, and networking with artists and AI developers from around the world.',
  '2025-11-15 10:00:00+00',
  'San Francisco, CA',
  200,
  true
);

-- Get the event ID and insert questions
INSERT INTO questions (event_id, question_text, question_type, order_index)
VALUES 
  (
    (SELECT id FROM events WHERE slug = 'ados-2025'),
    'What is your name?',
    'text',
    1
  ),
  (
    (SELECT id FROM events WHERE slug = 'ados-2025'),
    'Tell us about your experience with AI art tools',
    'textarea',
    2
  ),
  (
    (SELECT id FROM events WHERE slug = 'ados-2025'),
    'What are you most excited to learn?',
    'textarea',
    3
  ),
  (
    (SELECT id FROM events WHERE slug = 'ados-2025'),
    'How did you hear about ADOS?',
    'text',
    4
  ),
  (
    (SELECT id FROM events WHERE slug = 'ados-2025'),
    'What is your skill level with open-source AI tools?',
    'multiple_choice',
    5
  );
```

## Development Workflow

### Getting Started

1. **Clone & Install:**
   ```bash
   git clone [repo-url]
   cd ados
   npm install
   ```

2. **Setup Supabase:**
   - Create project at supabase.com
   - Run migrations from `supabase/migrations/`
   - Enable Discord OAuth
   - Copy env variables

3. **Setup Discord:**
   - Create app at discord.com/developers
   - Add OAuth2 redirect URL
   - Copy Client ID and Secret to Supabase

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Seed Database:**
   ```bash
   # Run seed.sql in Supabase SQL Editor
   ```

### Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
npm run type-check   # TypeScript checks
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Discord OAuth flow works
- [ ] User profile is created on first login
- [ ] Events list displays correctly
- [ ] Event details page loads
- [ ] Unauthenticated users are redirected
- [ ] Questionnaire saves answers
- [ ] Cannot apply twice to same event
- [ ] Dashboard shows user's applications
- [ ] Success page displays after submission
- [ ] Mobile responsive on all pages

### Future: Automated Testing

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests with Playwright

## Future Enhancements

### Phase 2
- [ ] Admin dashboard for managing events
- [ ] Email notifications (Supabase Email)
- [ ] Event capacity management
- [ ] Waitlist functionality
- [ ] Application review interface
- [ ] Bulk approval/rejection

### Phase 3
- [ ] Event check-in system (QR codes)
- [ ] Attendee networking features
- [ ] Event schedule builder
- [ ] Speaker/workshop management
- [ ] Analytics dashboard

### Phase 4
- [ ] Multiple event types (workshops, talks, etc.)
- [ ] Ticketing integration
- [ ] Payment processing (Stripe)
- [ ] Calendar integration
- [ ] Social sharing features

## Security Considerations

1. **Row Level Security**: All tables have RLS enabled
2. **OAuth Security**: Discord tokens handled by Supabase
3. **Input Validation**: Sanitize all user inputs
4. **Rate Limiting**: Implement on sensitive endpoints
5. **CORS**: Configure properly for production
6. **Environment Variables**: Never commit to repository
7. **SQL Injection**: Use parameterized queries (Supabase client handles this)

## Performance Optimizations

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Automatic with Next.js App Router
3. **Caching**: Implement for event listings
4. **Database Indexes**: Already defined in schema
5. **CDN**: Railway provides CDN automatically
6. **Lazy Loading**: Load questionnaire questions as needed

## Monitoring & Analytics

1. **Railway Logs**: Built-in logging
2. **Supabase Logs**: Database query logs
3. **Error Tracking**: Consider Sentry integration
4. **Analytics**: Consider Vercel Analytics or Plausible
5. **User Metrics**: Track application completion rate

## Success Metrics

- Number of signups
- Application completion rate
- Time to complete questionnaire
- User retention (return applicants)
- Event capacity fill rate

---

## Implementation Timeline

### Week 1: Foundation
- Setup Next.js project
- Configure Supabase
- Implement Discord auth
- Create database schema

### Week 2: Core Features
- Landing page
- Events list
- Event details
- Questionnaire component

### Week 3: Polish
- Dashboard
- Styling and animations
- Mobile responsiveness
- Testing

### Week 4: Deployment
- Railway deployment
- Production testing
- Documentation
- Launch

---

**Created by**: [Your Name]  
**Last Updated**: October 4, 2025  
**Version**: 1.0

