# ADOS - Event Management Platform

The event platform that celebrates art and open-source AI.

## Features

- 🎨 **Multi-Event Support** - Manage multiple events with custom questionnaires
- 🔐 **Discord Authentication** - Seamless OAuth integration via Supabase
- 📝 **Custom Questionnaires** - Per-event application forms with multiple question types
- 👤 **User Dashboard** - Track application status and history
- 🎯 **Application Management** - Submit and track event applications
- 📱 **Responsive Design** - Beautiful UI that works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth with Discord OAuth
- **Database**: Supabase PostgreSQL
- **Deployment**: Railway.com

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- A Discord application (for OAuth)
- Railway account (for deployment)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd ados
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

- Create a new project at [supabase.com](https://supabase.com)
- Go to Project Settings > API to get your URL and anon key
- Run the migration files in `supabase/migrations/` in the SQL Editor
- (Optional) Run `supabase/seed.sql` for test data

4. **Set up Discord OAuth**

- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create a new application
- Add OAuth2 redirect URL: `https://[your-project].supabase.co/auth/v1/callback`
- Copy Client ID and Secret
- In Supabase Dashboard, go to Authentication > Providers
- Enable Discord provider and add your Client ID and Secret

5. **Configure environment variables**

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Running Migrations

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL

### Seeding Test Data

1. In the Supabase SQL Editor
2. Copy the contents of `supabase/seed.sql`
3. Paste and run the SQL
4. This will create 3 sample events with questions

## Project Structure

```
/ados
├── app/                      # Next.js app directory
│   ├── auth/                 # Authentication routes
│   ├── events/               # Event pages
│   ├── dashboard/            # User dashboard
│   └── success/              # Success page
├── components/               # React components
│   ├── ui/                   # UI components
│   ├── Hero.tsx              # Landing page hero
│   ├── Navigation.tsx        # Top nav
│   ├── EventCard.tsx         # Event preview card
│   └── Questionnaire.tsx     # Multi-step form
├── lib/                      # Utility functions
│   ├── supabase/             # Supabase clients
│   ├── database/             # Database queries
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Helper functions
├── hooks/                    # Custom React hooks
├── supabase/                 # Database migrations & seeds
├── public/                   # Static files
└── middleware.ts             # Next.js middleware
```

## Deployment to Railway

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Next.js

### Step 3: Configure Environment Variables

In the Railway dashboard, add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_APP_URL=https://[your-app].up.railway.app
NODE_ENV=production
```

### Step 4: Update OAuth URLs

1. In Discord Developer Portal, add Railway URL to redirect URLs:
   - `https://[your-project].supabase.co/auth/v1/callback`

2. In Supabase Dashboard, add Railway URL to allowed redirect URLs:
   - Authentication > URL Configuration
   - Add: `https://[your-app].up.railway.app/auth/callback`

## Usage

### User Flow

1. **Landing Page** - Users see the hero section with background video
2. **Events List** - Browse available events
3. **Event Details** - View event information and questions
4. **Sign In** - Authenticate with Discord
5. **Apply** - Answer questionnaire for the event
6. **Dashboard** - Track application status

### Creating New Events

Currently, events must be created directly in the Supabase database. Use the SQL Editor:

```sql
INSERT INTO events (name, slug, description, date, location, max_attendees, is_active)
VALUES ('Event Name', 'event-slug', 'Description', '2025-12-01 10:00:00+00', 'Location', 100, true);
```

Then add questions for the event:

```sql
INSERT INTO questions (event_id, question_text, question_type, order_index)
VALUES 
  ('[event-id]', 'Question 1?', 'text', 1),
  ('[event-id]', 'Question 2?', 'textarea', 2);
```

### Managing Applications

Applications can be viewed and managed in the Supabase dashboard:

1. Go to Table Editor > attendance
2. View all applications
3. Update status: `pending`, `approved`, `rejected`, `waitlist`

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## Features Roadmap

### Phase 2
- [ ] Admin dashboard for event management
- [ ] Email notifications
- [ ] Waitlist functionality
- [ ] Bulk application actions

### Phase 3
- [ ] QR code check-in system
- [ ] Attendee networking features
- [ ] Event schedule builder

### Phase 4
- [ ] Payment integration
- [ ] Ticketing system
- [ ] Calendar sync
- [ ] Social sharing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.

---

**Created by banodoco**

