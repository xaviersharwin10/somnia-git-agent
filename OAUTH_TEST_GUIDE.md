# GitHub OAuth Testing Guide

## Quick Test Steps

### 1. Verify OAuth Endpoints Are Live

Test the OAuth initiation endpoint:
```bash
curl https://somnia-git-agent.onrender.com/auth/github
```

**Expected Response:**
- If OAuth is configured: Redirects to GitHub authorization page
- If OAuth is NOT configured: JSON error with manual setup instructions

### 2. Test Full OAuth Flow

1. **Visit the OAuth URL with your repo:**
   ```
   https://somnia-git-agent.onrender.com/auth/github?repo_url=https://github.com/xaviersharwin10/gitAgent.git
   ```

2. **You'll be redirected to GitHub:**
   - Click "Authorize GitAgent" (or your app name)
   - GitHub will show the permissions requested (repo access, webhook management)

3. **After authorization:**
   - GitHub redirects back to: `https://somnia-git-agent.onrender.com/auth/github/callback`
   - You should see a success page showing:
     - ✅ GitHub OAuth authorized
     - ✅ Webhook automatically configured
     - Links to dashboard

### 3. Verify Webhook Was Created

1. Go to your GitHub repo: https://github.com/xaviersharwin10/gitAgent
2. Settings → Webhooks
3. You should see a webhook pointing to:
   ```
   https://somnia-git-agent.onrender.com/webhook/github
   ```
4. The webhook should be active and listening for "push" events

### 4. Test Deployment Trigger

After OAuth is set up, try:
```bash
# Make a small change
cd ~/GitFi/agent-template
echo "# Test OAuth deployment" >> test-oauth.txt
git add test-oauth.txt
git commit -m "test: OAuth webhook deployment"
git push origin main
```

Check:
- Dashboard should show the deployment
- Agent should restart/redeploy
- New metrics should appear

## Troubleshooting

### OAuth Not Working?

1. **Check Render Environment Variables:**
   - `GITHUB_CLIENT_ID` is set
   - `GITHUB_CLIENT_SECRET` is set
   - `BACKEND_URL=https://somnia-git-agent.onrender.com`

2. **Verify Callback URL matches exactly:**
   - GitHub OAuth App → Authorization callback URL
   - Must be: `https://somnia-git-agent.onrender.com/auth/github/callback`

3. **Check Backend Logs in Render:**
   - Look for OAuth-related errors
   - Check if `axios` dependency is installed

### Webhook Not Auto-Created?

- Check OAuth scope: Needs `repo admin:repo_hook` permissions
- Verify GitHub token has access to the repository
- Check backend logs for webhook creation errors

## Manual Fallback

If OAuth doesn't work, users can still manually configure webhooks:
1. Repo → Settings → Webhooks → Add webhook
2. URL: `https://somnia-git-agent.onrender.com/webhook/github/push`
3. Events: Just the push event

