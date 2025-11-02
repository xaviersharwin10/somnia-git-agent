# GitAgent Deployment Guide

## 1. Deploy Backend to Render/Fly.io

### Using Render:
1. Connect your GitHub repository
2. Select "Web Service"
3. Use the Dockerfile in the `backend/` directory
4. Set environment variables:
   - `BACKEND_PRIVATE_KEY`
   - `SOMNIA_RPC_URL`
   - `AGENT_FACTORY_ADDRESS`
   - `MASTER_SECRET_KEY`
5. Deploy and get your public URL

### Using Fly.io:
1. Install flyctl
2. Run `fly launch` in the backend directory
3. Set secrets: `fly secrets set BACKEND_PRIVATE_KEY=...`
4. Deploy: `fly deploy`

## 2. Update CLI Production URL

1. Update `git-agent-cli/index.js`:
   ```javascript
   const API_BASE_URL = 'https://your-actual-backend-url.com';
   ```

2. Publish to npm:
   ```bash
   cd git-agent-cli
   npm publish
   ```

## 3. Publish create-somnia-agent

1. Update the template repository URL in `create-somnia-agent/index.js`
2. Publish to npm:
   ```bash
   cd create-somnia-agent
   npm publish
   ```

## 4. Set Up GitHub Webhook

1. Go to your repository settings
2. Add webhook URL: `https://your-backend-url.com/webhook/github`
3. Content type: `application/json`
4. Events: Select "Push events"

## 5. Test the Full Flow

1. `npx create-somnia-agent test-agent`
2. `cd test-agent`
3. `npm install -g git-agent-cli`
4. `git agent init`
5. `git agent secrets set GROQ_API_KEY=your-key`
6. `git push origin main`
7. `git agent stats`
8. `git agent logs`

## 6. Record Demo Video

Follow the `DEMO_SCRIPT.md` for the 5-minute demo recording.

## 7. Submit to Hackathon

1. Copy `HACKATHON_README.md` content
2. Upload demo video
3. Submit with all required information
