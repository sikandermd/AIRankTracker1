# Google Search Console API Troubleshooting

## Common JSON Format Issues in Replit Secrets

### Problem: "Unexpected non-whitespace character after JSON at position 12"

This error occurs when the Google Service Account JSON key is not properly formatted in Replit Secrets.

### Solution Steps:

1. **Get Your Service Account JSON File**
   - Download from Google Cloud Console
   - Should look like:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...",
     "client_email": "your-service@project.iam.gserviceaccount.com",
     "client_id": "123456789...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token"
   }
   ```

2. **Format for Replit Secrets**
   - Copy the ENTIRE JSON content
   - Remove any extra line breaks
   - Make it a single line OR properly formatted JSON
   - DO NOT add extra quotes around the JSON

3. **Add to Replit Secrets**
   - Go to Secrets tab in Replit
   - Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: Paste the complete JSON (without extra quotes)

4. **Verify Setup**
   - Restart your Repl
   - Check console logs for "Google Search Console API configured successfully"

### Alternative: Manual Position Tracking

If API setup is complex, you can:
1. Add keywords manually
2. Update positions manually in the database
3. Use the interface for tracking trends

### Need Help?

If you continue having issues:
1. Double-check the JSON format
2. Ensure the service account has Search Console API permissions
3. Verify your domains are added to Search Console
4. Check the complete setup guide in SEARCH_CONSOLE_SETUP.md