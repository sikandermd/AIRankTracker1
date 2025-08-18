# AI Ranking Tracker - n8n Integration Guide

## Overview
यह guide आपको बताती है कि AI Ranking Tracker को n8n automation platform के साथ कैसे integrate करें।

## Available API Endpoints for n8n

### 1. Keyword Tracking
**Endpoint:** `POST /api/keywords/track`
**Purpose:** Start tracking keywords across AI platforms
**Input:**
```json
{
  "keywords": ["best crm software", "customer data platform"],
  "brandId": "your-brand-id",
  "platforms": ["gpt", "claude", "gemini", "perplexity"]
}
```

### 2. Get Latest Results
**Endpoint:** `GET /api/tracking-results/latest`
**Purpose:** Retrieve latest tracking results
**Output:** Array of tracking results with brand mentions and competitor analysis

### 3. Brand Management
**Endpoint:** `POST /api/brands`
**Purpose:** Create new brands for tracking
**Input:**
```json
{
  "name": "Your Brand",
  "slug": "your-brand",
  "description": "Brand description"
}
```

### 4. Get All Brands
**Endpoint:** `GET /api/brands`
**Purpose:** Get list of all brands

## n8n Workflow Examples

### Example 1: Automated Daily Tracking
```
1. Cron Trigger (daily at 9 AM)
2. HTTP Request → POST /api/keywords/track
3. Wait 30 seconds
4. HTTP Request → GET /api/tracking-results/latest
5. Email/Slack notification with results
```

### Example 2: Brand Mention Monitoring
```
1. Webhook Trigger (when new content published)
2. HTTP Request → Track specific keywords
3. Filter results for brand mentions
4. Send alert if mention count changes
```

### Example 3: Competitor Analysis Pipeline
```
1. Schedule Trigger (weekly)
2. HTTP Request → Track competitor keywords
3. Analyze competitor visibility scores
4. Generate report and send to team
```

## Environment Variables for n8n
Set these in your n8n environment:
- `TRACKER_BASE_URL`: Your tracker's base URL
- `TRACKER_API_KEY`: Authentication token (if required)

## Custom n8n Node Development
For advanced integration, you can create custom n8n nodes:

### Node Structure:
```
- AI Tracker Keyword Monitor
- AI Tracker Brand Analyzer
- AI Tracker Report Generator
```

## Webhook Integration
Add webhook endpoints to your tracker to push data to n8n:

```javascript
// In your tracker API
app.post('/api/webhooks/results', (req, res) => {
  // Send results to n8n webhook URL
  // Trigger n8n workflows automatically
});
```

## Use Cases in n8n:

1. **Content Marketing Automation:**
   - Track brand mentions → Update content calendar → Generate reports

2. **Competitor Intelligence:**
   - Monitor competitor keywords → Analyze trends → Send alerts

3. **SEO Workflow:**
   - Track keyword rankings → Update SEO strategy → Report to team

4. **Brand Monitoring:**
   - Real-time mention tracking → Instant notifications → Response automation

## Authentication
If you need authentication, add API key validation:
```javascript
// Add to your routes
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === process.env.API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

## Next Steps:
1. Deploy your AI Ranking Tracker
2. Create n8n workflows using HTTP Request nodes
3. Set up automated schedules for tracking
4. Configure notifications based on results