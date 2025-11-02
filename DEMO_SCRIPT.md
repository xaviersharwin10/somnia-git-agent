# GitAgent Demo Script (5 Minutes)

## Intro (30 seconds)

"Hi, I'm [Your Name] and this is GitAgent. Deploying AI agents is hard. It's manual, complex, and requires managing secrets, monitoring, and scaling. What if we could make it as easy as `git push`? That's exactly what GitAgent does - it's the 'Vercel for AI Agents'."

## Part 1: The "Onboarding" (60 seconds)

**Start in an empty folder.**

```bash
npx create-somnia-agent my-ai-bot
cd my-ai-bot
```

**Show the generated project structure:**
- "This creates a complete AI trading bot template with TypeScript, Groq integration, and everything ready to go."

```bash
git init
git add .
git commit -m "Initial commit"
```

**Open GitHub in browser:**
- "Let's create a new repository on GitHub and push our code."

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

**Show GitHub repository settings:**
- "Now I need to add the GitAgent webhook to this repository."
- "I'll add the webhook URL pointing to our deployed backend."

```bash
npm install -g git-agent-cli
git agent init
```

**Show the .gitagent.json file:**
- "This creates the GitAgent configuration file."

```bash
git agent secrets set GROQ_API_KEY=sk-your-actual-key-here
```

**Show success message:**
- "Secrets are encrypted and stored securely for this branch."

## Part 2: The First Deploy (60 seconds)

```bash
git push origin main
```

**Open backend logs in browser:**
- "The webhook is received... let's watch the magic happen."
- "The backend is cloning the repository, installing dependencies, and starting the agent."

```bash
git agent logs
```

**Show the AI agent's output:**
- "Look at this - the AI agent is making trading decisions in real-time!"
- "It's analyzing SOMI prices and deciding whether to BUY or HOLD."

```bash
git agent stats
```

**Show the stats:**
- "The agent is online, running, and has a balance on Somnia."
- "Status: ONLINE, Balance: 1.5 SOMI"

## Part 3: The "A/B Test" (90 seconds) - The "Wow" Moment

"This is where it gets interesting. Let's create a more aggressive trading strategy."

```bash
git checkout -b aggressive
```

**Open agent.ts in editor:**
- "I'll modify the AI prompt to be more aggressive."
- "Change the prompt to: 'You are an aggressive degen trader. Should I BUY or HOLD?'"

```bash
git add .
git commit -m "Make agent more aggressive"
git push -u origin aggressive
```

**Show backend logs again:**
- "A new agent is being deployed for the aggressive branch!"
- "Now we have two agents running in parallel."

```bash
git agent compare main aggressive
```

**Show the comparison table:**
- "Look at this - we can compare both agents side by side!"
- "Different strategies, different balances, both running simultaneously."
- "This is the 'Vercel for Agents' experience - git branch is your A/B test!"

## Part 4: The Rollback (30 seconds)

"The aggressive agent is losing money! Let's roll it back."

```bash
git revert HEAD
git push origin aggressive
```

**Show the agent logs updating:**
- "The agent automatically restarts with the new code."
- "Safe, easy rollbacks just like any other deployment."

## Conclusion (30 seconds)

"That's GitAgent. It makes agent deployment simple, safe, and collaborative. You get:

- **Zero-friction deployment** with `git push`
- **A/B testing** with git branches
- **Secure secret management**
- **Real-time monitoring and logs**
- **Easy rollbacks and collaboration**

GitAgent: Making AI agent deployment as easy as pushing code. Thank you!"

---

## Recording Tips

1. **Screen Recording**: Use OBS or similar to record screen + webcam
2. **Terminal**: Use a large font, dark theme for better visibility
3. **Browser**: Have tabs ready for GitHub, backend logs, and stats
4. **Pacing**: Keep it energetic but not rushed
5. **Highlight**: Emphasize the "wow" moments (A/B testing, real-time logs)
6. **Demo Data**: Use realistic but not sensitive API keys
7. **Backup Plan**: Have a pre-recorded version of the deployment process ready
