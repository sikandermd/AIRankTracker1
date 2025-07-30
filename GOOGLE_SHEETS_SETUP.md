# Google Sheets Integration Setup

To enable keyword import from Google Sheets, you need to set up Google Cloud authentication.

## Step-by-Step Setup Instructions

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "AI Ranking Tracker")
4. Click "Create"

### 2. Enable Google Sheets API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### 3. Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter service account details:
   - **Name**: `ai-ranking-tracker-sheets`
   - **Description**: `Service account for Google Sheets integration`
4. Click "Create and Continue"
5. Skip roles for now (click "Continue")
6. Click "Done"

### 4. Generate Service Account Key
1. Find your service account in the list
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" → "Create New Key"
5. Choose "JSON" format
6. Click "Create"
7. **Save the downloaded JSON file securely**

### 5. Add to Replit Environment
1. Open the JSON file in a text editor
2. Copy the entire JSON content
3. In Replit, go to the "Secrets" tab (lock icon in sidebar)
4. Add a new secret:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON content
5. Save the secret

### 6. Share Your Google Sheet
1. Open your Google Sheet with keywords
2. Click "Share" button
3. Add the service account email (from the JSON file, field `client_email`)
4. Give it "Viewer" permissions
5. Click "Send"

## Expected Sheet Format

Your Google Sheet should have these columns:

| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Keyword  | Category | Brand    | Platforms|
| best cdp tools | Product | Segment | all |
| customer data | General | Segment | gpt,claude |

### Column Details:
- **A (Keyword)**: Required - The keyword to track
- **B (Category)**: Optional - Keyword category (defaults to null)
- **C (Brand)**: Optional - Brand name (defaults to "Default Brand")
- **D (Platforms)**: Optional - AI platforms to track (defaults to "all")

### Platform Options:
- `all` - Track on all platforms
- `gpt` or `chatgpt` - ChatGPT only
- `claude` - Claude only
- `gemini` - Gemini only
- `perplexity` - Perplexity only
- Multiple: `gpt,claude` - Multiple platforms

## Troubleshooting

### "Method doesn't allow unregistered callers"
- Make sure the `GOOGLE_SERVICE_ACCOUNT_KEY` secret is set
- Verify the JSON is complete and valid
- Ensure Google Sheets API is enabled

### "Permission denied"
- Share the Google Sheet with the service account email
- Give at least "Viewer" permissions

### "Invalid spreadsheet URL"
- Use the full Google Sheets URL
- URL should contain `/spreadsheets/d/[ID]`

## Security Notes
- Never commit the JSON key file to version control
- Keep the service account key secure
- Use minimum required permissions
- Regularly rotate service account keys in production