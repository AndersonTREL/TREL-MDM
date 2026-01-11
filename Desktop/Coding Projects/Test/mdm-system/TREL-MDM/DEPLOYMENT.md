# Deploying TREL-MDM to Railway

This guide will help you deploy your Next.js application to [Railway](https://railway.app/).

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Railway](https://railway.app/) account.
- Your project pushed to a GitHub repository.

## Step 1: Create a Project & Database
1. Log in to Railway.
2. Click **"New Project"** -> **"Provision PostgreSQL"**.
3. Once the database is created, click on it to view its details.
4. Go to the **Variables** tab and copy the `DATABASE_URL`.

## Step 2: Deploy the Application
1. Click **"New"** (or press `Cmd/Ctrl + K`) and select **"GitHub Repo"**.
2. Select your `mdm-system` repository.
3. Click "Deploy Now".

## Step 3: Configure Environment Variables
1. Click on your newly created Service (the Next.js app).
2. Go to the **Variables** tab.
3. Add the following variable:
   - `DATABASE_URL`: *Paste the URL you copied from the PostgreSQL service*
   - `NEXTAUTH_SECRET`: *Generate a random string (e.g. `openssl rand -base64 32`)* (If you add auth later)
   - `NEXT_PUBLIC_APP_URL`: *The domain Railway gives you (e.g. `https://mdm-system.up.railway.app`)*

## Step 4: Run Migrations
Railway usually builds your app automatically. However, for the first run, you need to push your Prisma schema to the new database.
1. In your project, go to **Settings** -> **Build**.
2. Update the **Build Command** to:
   ```bash
   npx prisma generate && npm run build
   ```
3. Update the **Deploy Command** to:
   ```bash
   npx prisma migrate deploy && npm start
   ```
   *Note: This ensures the database is always in sync with your schema.*

## Step 5: Verify
- Wait for the deployment to finish.
- Click the provided URL to open your app.
- Check the **Logs** tab if anything goes wrong.

## Important Note on "DBE2/DBE3"
The application is now configured to strictly use **DBE2** and **DBE3** for device locations.
