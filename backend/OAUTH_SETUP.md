# GitHub OAuth Setup for Automatic Webhook Configuration

GitAgent supports **automatic webhook setup** via GitHub OAuth (similar to Vercel), eliminating the need for manual webhook configuration.

## How It Works

1. User visits `/auth/github?repo_url=YOUR_REPO_URL`
2. User authorizes GitAgent via GitHub OAuth
3. GitAgent automatically creates a webhook via GitHub API
4. Future `git push` events trigger deployments automatically

## Setup Instructions

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `GitAgent`
   - **Homepage URL**: `https://somnia-git-agent.onrender.com`
   - **Authorization callback URL**: `https://somnia-git-agent.onrender.com/auth/github/callback`
4. Click "Register application"
5. Copy **Client ID** and generate a **Client Secret**

### 2. Set Environment Variables

Add to your backend `.env` file:

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
BACKEND_URL=https://somnia-git-agent.onrender.com
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here  # Optional, for webhook verification
```

### 3. Deploy

The OAuth endpoints will be available at:
- **Initiate OAuth**: `https://somnia-git-agent.onrender.com/auth/github`
- **Callback**: `https://somnia-git-agent.onrender.com/auth/github/callback`

## Usage for End Users

### Automatic Setup (Recommended)

```bash
# 1. Visit OAuth URL with your repo
https://somnia-git-agent.onrender.com/auth/github?repo_url=https://github.com/username/repo.git

# 2. Authorize GitAgent
# 3. Webhook is automatically configured!
# 4. Just git push to deploy
```

### Manual Setup (Fallback)

If OAuth is not configured, users can manually set up webhooks:
1. Go to repo → Settings → Webhooks
2. Add webhook pointing to: `https://somnia-git-agent.onrender.com/webhook/github`

## Benefits

- ✅ **Zero-friction onboarding** - No manual webhook configuration needed
- ✅ **Vercel-like experience** - Familiar workflow for developers
- ✅ **Automatic webhook management** - GitAgent handles everything
- ✅ **Secure** - Tokens encrypted and stored securely

## Database Schema

OAuth tokens are stored in `github_oauth` table:
- `user_id`: GitHub username
- `access_token`: GitHub OAuth token (encrypted)
- `repo_url`: Associated repository
- `webhook_configured`: Boolean flag

## Security Notes

- OAuth tokens are encrypted using `SimpleCrypto` with `MASTER_SECRET_KEY`
- Tokens stored in SQLite database (encrypted)
- Webhook secrets can be configured for additional security
- OAuth scope: `repo admin:repo_hook` (minimal required permissions)

