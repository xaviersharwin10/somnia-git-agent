# GitHub Webhook Setup

## Step 1: Go to your GitHub repository
1. Open: https://github.com/xaviersharwin10/test-gitagent
2. Click **Settings** (top right)
3. Click **Webhooks** (left sidebar)
4. Click **Add webhook**

## Step 2: Configure the webhook
- **Payload URL**: `http://localhost:3005/webhook/github`
- **Content type**: `application/json`
- **Events**: Select "Push events"
- **Active**: ✅ Checked
- Click **Add webhook**

## Step 3: Test the webhook
After setting up the webhook, make another push to trigger it:

```bash
echo "console.log('🚀 Webhook test!');" >> agent.ts
git add .
git commit -m "Test webhook"
git push origin main
```

## Step 4: Check backend logs
Look at the backend terminal to see if the webhook was received and processed.

## Step 5: Test CLI commands
```bash
git agent secrets set GROQ_API_KEY=sk-test-key-here
git agent stats
git agent logs
```
