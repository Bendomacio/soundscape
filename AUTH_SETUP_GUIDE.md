# Authentication Setup Guide

This guide walks you through setting up real authentication with email/password and social logins (Google, Discord, Facebook).

**Estimated time: 15-20 minutes**

---

## Step 1: Run the Database Migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase-auth-migration.sql` and paste it
6. Click **Run** (or press Cmd/Ctrl + Enter)

You should see "Success. No rows returned" - this is normal for DDL statements.

---

## Step 2: Enable Email Auth (Already enabled by default)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. **Email** should already be enabled
3. Optionally configure:
   - **Confirm email**: Toggle ON to require email verification
   - **Secure email change**: Toggle ON for security

---

## Step 3: Set Up Google OAuth

### 3a. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: **SoundScape**
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue through the scopes (no changes needed)
6. Back in Credentials, create OAuth client ID:
   - Application type: **Web application**
   - Name: **SoundScape**
   - **Authorized JavaScript origins**: Add your app's origin (NO path):
     ```
     http://localhost:5173
     ```
     (For production, also add your domain like `https://yourdomain.com`)
   - **Authorized redirect URIs**: Add your Supabase callback URL (WITH path):
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Find YOUR_PROJECT_REF in Supabase Dashboard → Settings → API → Project URL)
7. Copy the **Client ID** and **Client Secret**

### 3b. Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and toggle it ON
3. Paste your **Client ID** and **Client Secret**
4. Save

---

## Step 4: Set Up Discord OAuth

### 4a. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name: **SoundScape**
4. Go to **OAuth2** → **General**
5. Add Redirect URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
6. Copy the **Client ID** and **Client Secret**

### 4b. Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Discord** and toggle it ON
3. Paste your **Client ID** and **Client Secret**
4. Save

---

## Step 5: Set Up Facebook OAuth

### 5a. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** (or appropriate type)
4. App name: **SoundScape**
5. Once created, go to **Settings** → **Basic**
6. Copy the **App ID** and **App Secret**
7. Add your Supabase callback to **Valid OAuth Redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
8. Go to **Facebook Login** → **Settings**
9. Add the same callback URL to **Valid OAuth Redirect URIs**

### 5b. Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Facebook** and toggle it ON
3. Paste your **App ID** (as Client ID) and **App Secret** (as Client Secret)
4. Save

---

## Step 6: Configure Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:

1. **Site URL**: Set to your app's URL
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

2. **Redirect URLs**: Add all allowed URLs:
   ```
   http://localhost:5173
   http://localhost:5174
   https://yourdomain.com
   ```

---

## Step 7: Test the Setup

1. Start your dev server: `npm run dev`
2. Click the user icon → try each login method
3. Verify:
   - Email signup sends confirmation email
   - Google/Discord/Facebook redirect and return correctly
   - User avatar and name appear after login
   - Songs can be submitted (requires login)

---

## Making a User Admin

After a user has signed up, you can make them an admin:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run:
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
   ```

---

## Troubleshooting

### "Invalid redirect URI"
- Make sure the callback URL in your OAuth provider matches exactly:
  `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### Social login doesn't redirect back
- Check **Site URL** and **Redirect URLs** in Supabase Auth settings
- Make sure your app URL is in the allowed list

### User profile not created
- The trigger should auto-create profiles on signup
- Check Supabase logs for any errors

### RLS errors when submitting songs
- Make sure you're logged in (check browser console)
- Verify the migration ran successfully
- Check that user_id is being passed when inserting

---

## Files Changed

- `src/contexts/AuthContext.tsx` - Real Supabase auth with OAuth
- `src/components/AuthModal.tsx` - Social login buttons
- `src/components/Header.tsx` - Profile avatar display
- `src/lib/songs.ts` - user_id handling
- `src/types/index.ts` - userId field
- `src/App.tsx` - Login required for submissions
- `supabase-auth-migration.sql` - Database changes
