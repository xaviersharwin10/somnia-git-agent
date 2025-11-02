# GitAgent AI Starter Template

This is a simple, AI-powered trading agent designed to run on the GitAgent platform

## How it Works

This agent runs a loop every 30 seconds:
1. It gets the current (mock) price of SOMI.
2. It queries a Groq LLM with a prompt to get a 'BUY' or 'HOLD' decision.
3. It logs the decision.

## Local Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file and add your Groq API key:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

3. Run the agent:
   ```bash
   npm install -g ts-node
   ts-node agent.ts
   ```

## Deploying with GitAgent

1. Push this repo to GitHub.
2. Use `git agent init` and `git agent secrets set GROQ_API_KEY=...`
3. `git push` to deploy!

## Environment Variables

The agent expects these environment variables (injected by GitAgent in production):

- `GROQ_API_KEY`: Your Groq API key for LLM access
- `AGENT_CONTRACT_ADDRESS`: The deployed agent contract address
- `AI_PROMPT`: (Optional) Custom prompt for the AI decision making

## Features

- 🤖 **AI-Powered Decisions**: Uses Groq's Llama3-8b model for trading decisions
- 📊 **Mock Price Feed**: Simulates SOMI price volatility for testing
- 🔄 **Continuous Loop**: Runs every 30 seconds automatically
- 🔐 **Secure Secrets**: Environment variables injected by GitAgent platform
- 📝 **Configurable Prompts**: Customize AI behavior with different prompts

## Customization

You can customize the agent by:

1. **Changing the AI Prompt**: Set `AI_PROMPT` environment variable
2. **Modifying the Price Feed**: Update the `getSomiPrice()` function
3. **Adding Real Trading Logic**: Implement actual blockchain interactions
4. **Adjusting Timing**: Change the interval in `setInterval(runDecisionLoop, 30000)`

## Example Output

```
🤖 AI Agent 0x1234...abcd starting...
Prompt: "You are a cautious financial analyst. Based on the price, should I 'BUY' or 'HOLD'?"
[PriceFeed] New SOMI price: $2987.45
[AI Decision] AI decided: HOLD.
[PriceFeed] New SOMI price: $3012.33
[AI Decision] AI decided: BUY. Executing trade...
```
# Reload test
