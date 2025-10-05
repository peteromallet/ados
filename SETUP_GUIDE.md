# ADOS Setup Guide

This guide will walk you through setting up the ADOS event management platform from scratch.

## Quick Start Checklist

- [ ] Install dependencies
- [ ] Create Supabase project
- [ ] Set up Discord OAuth app
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Test locally
- [ ] Deploy to Railway

---

## Step 1: Install Dependencies

```bash
cd /Users/peteromalley/ados
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `ados` (or your choice)
   - Database Password: (save this somewhere safe)
   - Region: Choose closest to you
4. Wait for project to finish setting up (~2 minutes)

5. Get your API credentials:
   - Go to Project Settings (gear icon) > API
   - Copy `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Set Up Discord OAuth

### 3.1 Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it: `ADOS` (or your choice)
4. Click "Create"

### 3.2 Configure OAuth2

1. In your Discord app, go to "OAuth2" in the left sidebar
2. Click "Add Redirect"
3. Add this URL (replace `YOUR_PROJECT_ID` with your Supabase project ID):
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
4. Click "Save Changes"

### 3.3 Get Credentials

1. Still in OAuth2 section
2. Copy `CLIENT ID`
3. Copy `CLIENT SECRET` (click "Reset Secret" if needed)

### 3.4 Configure in Supabase

1. Go to your Supabase project
2. Navigate to: Authentication > Providers
3. Find "Discord" and toggle it on
4. Enter:
   - Discord Client ID: (paste from Discord)
   - Discord Client Secret: (paste from Discord)
5. Click "Save"

## Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# In /Users/peteromalley/ados/.env.local

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace:
- `YOUR_PROJECT_ID` with your actual Supabase project ID
- `your_anon_key_here` with your actual anon key

## Step 5: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Open `supabase/migrations/001_initial_schema.sql` from your project
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click "Run" (or press Cmd/Ctrl + Enter)
8. Wait for "Success" message

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

## Step 6: Seed Test Data (Optional)

To add sample events for testing:

1. In Supabase SQL Editor
2. Open `supabase/seed.sql` from your project
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click "Run"
6. This creates 3 sample events with questions

## Step 7: Test Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing Checklist

- [ ] Landing page loads with video background
- [ ] Click "Apply To Join" → redirects to /events
- [ ] Events list shows (if seeded)
- [ ] Click "Sign In" → redirects to Discord OAuth
- [ ] After Discord auth, redirected back to site
- [ ] Profile shows in top right
- [ ] Can view event details
- [ ] Can apply to event (questionnaire works)
- [ ] Submission redirects to success page
- [ ] Dashboard shows applications

## Step 8: Verify Database

Check that data was created:

1. Go to Supabase > Table Editor
2. Check tables exist:
   - profiles
   - events
   - questions
   - attendance
   - answers

## Troubleshooting

### "User not authenticated" error
- Make sure Discord OAuth is properly configured
- Check that redirect URLs match exactly
- Try signing out and in again

### "Failed to load event" error
- Verify database migrations ran successfully
- Check that RLS policies are enabled
- Make sure events exist (run seed.sql)

### Discord OAuth doesn't work
- Verify redirect URL in Discord matches Supabase exactly
- Make sure Client ID and Secret are correct
- Check that Discord provider is enabled in Supabase

### Video doesn't play
- Make sure `bg_vid.mov` is in the `public/` folder
- Check browser console for errors
- Some browsers block autoplay - this is normal

---

## Step 9: Deploy to Railway (Production)

### 9.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 9.2 Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Click "Deploy from GitHub repo"
5. Select your `ados` repository
6. Railway will automatically detect Next.js

### 9.3 Configure Environment Variables

In Railway dashboard:

1. Click on your project
2. Go to "Variables" tab
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=https://YOUR_APP.up.railway.app
NODE_ENV=production
```

4. Click "Deploy" or it will auto-deploy

### 9.4 Get Your Railway URL

1. After deployment, click on your service
2. Go to "Settings" tab
3. Under "Domains", you'll see your Railway URL
4. Copy it (e.g., `https://ados-production.up.railway.app`)

### 9.5 Update OAuth URLs

#### Update Discord:

1. Go to Discord Developer Portal
2. Your application > OAuth2
3. Add Railway URL to redirects:
   ```
   https://YOUR_APP.up.railway.app/auth/callback
   ```
4. Save

#### Update Supabase:

1. Go to Supabase Dashboard
2. Authentication > URL Configuration
3. Under "Redirect URLs", add:
   ```
   https://YOUR_APP.up.railway.app/**
   ```
4. Save

### 9.6 Test Production

1. Visit your Railway URL
2. Test the full flow:
   - Landing page loads
   - Sign in with Discord works
   - Can apply to events
   - Dashboard works

---

## Next Steps

### Add Your First Real Event

1. Go to Supabase > SQL Editor
2. Run:

```sql
INSERT INTO events (name, slug, description, long_description, date, location, max_attendees, is_active)
VALUES (
  'Your Event Name',
  'your-event-slug',
  'Short description',
  'Long description with details...',
  '2025-12-01 10:00:00+00',
  'Your Location',
  100,
  true
);
```

3. Get the event ID:

```sql
SELECT id FROM events WHERE slug = 'your-event-slug';
```

4. Add questions:

```sql
INSERT INTO questions (event_id, question_text, question_type, order_index)
VALUES 
  ('EVENT_ID_HERE', 'What is your name?', 'text', 1),
  ('EVENT_ID_HERE', 'Why do you want to attend?', 'textarea', 2);
```

### Customize the Design

- Edit `components/Hero.tsx` for landing page
- Edit `app/globals.css` for global styles
- Edit `tailwind.config.js` for color scheme

### Monitor Applications

1. Go to Supabase > Table Editor
2. View `attendance` table
3. Filter by `status` to see pending/approved/rejected
4. Update status manually or build admin interface

---

## Support

If you run into issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Check Supabase logs (Logs & Analytics)
4. Check Railway logs (Deployments > View Logs)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Discord OAuth Documentation](https://discord.com/developers/docs/topics/oauth2)

---

**Good luck with your ADOS event! 🎨🤖**

