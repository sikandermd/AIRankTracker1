# Google Search Console API Setup

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Search Console API**

## Step 2: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Enter name: `search-console-service`
4. Click **Create and Continue**
5. Skip role assignment (not needed for Search Console)
6. Click **Done**

## Step 3: Generate Service Account Key

1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Select **JSON** format
5. Download the JSON file

## Step 4: Add Service Account to Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your website property
3. Go to **Settings** → **Users and permissions**
4. Click **Add User**
5. Enter the service account email (from JSON file): `search-console-service@your-project.iam.gserviceaccount.com`
6. Set permission to **Full**
7. Click **Add**

## Step 5: Add Environment Variable

1. Copy the entire JSON file content
2. In Replit, go to **Secrets** (lock icon in left sidebar)
3. Add new secret:
   - **Name**: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON content

Example JSON structure:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "search-console-service@your-project.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## Step 6: Verify Setup

1. Restart your Replit application
2. Go to Organic SEO tab
3. Add keywords with your verified domain
4. Click "Sync with Search Console" button
5. Your keywords should update with real Google positions

## Supported Countries

- USA (usa)
- India (ind) 
- United Kingdom (gbr)
- Canada (can)
- Australia (aus)
- Germany (deu)
- France (fra)
- Japan (jpn)

## Rate Limits

- 1,000 requests per day (free)
- 100 requests per 100 seconds
- The service automatically adds delays between requests

## Troubleshooting

1. **"Not configured" error**: Check if GOOGLE_SERVICE_ACCOUNT_KEY secret is set
2. **"Permission denied"**: Ensure service account is added to Search Console with Full permission
3. **"Site not found"**: Make sure domain matches exactly with Search Console property
4. **No data returned**: Check if domain has been verified in Search Console for at least 24 hours

## API Usage

The organic keywords tracker automatically syncs with Search Console to get:
- Real keyword positions (1-100+ ranking)
- Click-through rates and impressions
- Landing page URLs
- Historical position changes
- Country-specific data