# Example Usage

## Local Development

1. **Clone and setup:**
   ```bash
   git clone <your-repo-url> my-agent
   cd my-agent
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your Groq API key
   ```

3. **Run locally:**
   ```bash
   npm start
   ```

## Deploy to GitAgent Platform

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial agent template"
   git push origin main
   ```

2. **Configure webhook:**
   - Go to your GitHub repository settings
   - Add webhook pointing to your GitAgent backend
   - Select "push" events

3. **Set secrets via API:**
   ```bash
   curl -X POST http://your-backend-url/api/secrets \
     -H "Content-Type: application/json" \
     -d '{
       "repo_url": "https://github.com/your-username/your-repo.git",
       "branch_name": "main",
       "key": "GROQ_API_KEY",
       "value": "your-groq-api-key"
     }'
   ```

4. **Trigger deployment:**
   ```bash
   git commit --allow-empty -m "Trigger deployment"
   git push
   ```

## Customization Examples

### Aggressive Trading Bot
Set `AI_PROMPT` to:
```
"You are an aggressive degen trader. You should BUY when the price drops more than 2% and HOLD otherwise. Always look for opportunities to make money."
```

### Conservative Analyst
Set `AI_PROMPT` to:
```
"You are a conservative financial analyst. Only BUY when you are 90% confident the price will go up. Otherwise HOLD."
```

### Technical Analysis Bot
Set `AI_PROMPT` to:
```
"You are a technical analysis expert. Analyze the price movement and only BUY if you see strong bullish signals. Otherwise HOLD."
```
