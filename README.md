# Guitar Studio

A private lesson management app for guitar teachers. Students get a secret URL to view their lesson notes, weekly focus, and repertoire. You manage everything from a password-protected admin panel.

---

## Features

- **Per-student secret URLs** — no login required for students
- **Admin panel** — password-protected, full CRUD
- **Lesson logging** — what we covered, weekly focus, songs worked on
- **Song library** — shared across all students, cross-reference who's worked on what
- **Email delivery** — send lesson notes directly to students via Resend
- **Active / Inactive roster** — archive students without deleting history

---

## Setup

### 1. Supabase (database)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run the contents of `supabase-schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Resend (email)

1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your sending domain (or use `onboarding@resend.dev` for testing)
3. Create an API key → `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to something like `Guitar Studio <lessons@yourdomain.com>`

> Email is only sent when you click "✉ Send" in the admin — it never sends automatically.

### 3. Deploy to Vercel

1. Push this folder to a GitHub repo
2. Import the repo at [vercel.com](https://vercel.com)
3. Add these environment variables in Vercel's project settings:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase project settings |
| `ADMIN_PASSWORD` | Your chosen admin password |
| `SESSION_SECRET` | Any long random string (32+ chars) |
| `RESEND_API_KEY` | From Resend dashboard |
| `RESEND_FROM_EMAIL` | e.g. `Guitar Studio <lessons@yourdomain.com>` |
| `NEXT_PUBLIC_BASE_URL` | Your Vercel URL, e.g. `https://guitar-studio.vercel.app` |

4. Deploy — Vercel will build and deploy automatically.

---

## Usage

### Adding a student
1. Go to `/admin` and sign in
2. Click **+ Add Student**, fill in their details
3. Click into the student and hit **Student page ↗** to get their URL
4. Text or email them the link — that's all they need

### Logging a lesson
1. Go to the student's detail page
2. Click **+ Log Lesson**
3. Fill in what you covered and their focus for the week
4. Pick any songs from the library (or add new ones inline)
5. Optionally click **✉ Send** to email the notes

### Marking a student inactive
On the student detail page, click **Mark Inactive**. They'll move to the Inactive tab. Their history is fully preserved and you can reactivate them anytime.

### Song cross-reference
Go to **Song Library** in the nav. Click any song to see every student who's worked on it.

---

## Local development

```bash
cp .env.example .env.local
# Fill in your env vars

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
