# 🚀 ADOS Deployment Guide

## Step 1: Set Up Hosted Supabase Database

### Run Database Migrations

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/cyodlgfmrsvpocvgbykn
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** to execute the migration
6. You should see "Success. No rows returned"

### Seed Initial Data

1. Still in the SQL Editor, create another **New Query**
2. Copy and paste the entire contents of `supabase/seed.sql`
3. Click **Run** to execute
4. This will create the ADOS 2025 event and questions

### Set Up Discord OAuth (Important!)

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Discord** provider
3. You'll need to create a Discord OAuth app:
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Go to **OAuth2** → **General**
   - Add redirect URL: `https://cyodlgfmrsvpocvgbykn.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Paste them into your Supabase Discord provider settings
5. Save the settings

## Step 2: Deploy to Railway

### Prepare Repository

1. Initialize git (if not already):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Push to GitHub:
```bash
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ados.git
git branch -M main
git push -u origin main
```

### Deploy on Railway

1. Go to https://railway.app/new
2. Click **Deploy from GitHub repo**
3. Select your `ados` repository
4. Railway will auto-detect Next.js

### Configure Environment Variables

In Railway dashboard, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://cyodlgfmrsvpocvgbykn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5b2RsZ2ZtcnN2cG9jdmdieWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTU2NTAsImV4cCI6MjA3NTE3MTY1MH0.mKz6aOOS6mckQFLrQs8f65FzBAq6zwOyX-3bg3jfIDw
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

**Important:** Update `NEXT_PUBLIC_APP_URL` with your actual Railway URL after deployment!

### Update Discord OAuth Redirect

After you get your Railway URL:
1. Go back to Discord Developer Portal
2. Add another redirect URL: `https://your-app.railway.app/auth/callback`
3. Update Supabase Discord provider with the same redirect URL

## Step 3: Add Video Files

Your videos need to be accessible:

**Option 1: Keep in repo (Simple)**
- Videos are in `/public/bg.mp4` and `/public/bg_epic.mov`
- These will deploy with your app
- Note: May make deployments slower

**Option 2: Use CDN (Better for production)**
- Upload videos to a CDN (Cloudflare R2, AWS S3, etc.)
- Update paths in `components/Hero.tsx` to point to CDN URLs

## Step 4: Test Everything

1. Visit your Railway URL
2. Test the landing page (both Chill and Epic modes)
3. Click "I'd like to join" → should redirect to event page
4. Click "Proceed to questions" → should show auth modal
5. Try signing in with Discord
6. Complete the questionnaire
7. Try the invite code feature with code: `goodiewoodie`

## 🎉 You're Live!

Your ADOS application is now deployed and ready for applicants!

## Troubleshooting

**Videos not loading?**
- Check browser console for errors
- Verify video files are in the correct format (H.264 MP4 recommended)
- Check file sizes - Railway has deployment limits

**Auth not working?**
- Verify Discord OAuth redirect URLs match exactly
- Check environment variables are set correctly in Railway
- Ensure `NEXT_PUBLIC_APP_URL` matches your Railway domain

**Database errors?**
- Verify migrations ran successfully in Supabase SQL Editor
- Check RLS policies are enabled
- Verify seed data was inserted

## Need Help?

- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
