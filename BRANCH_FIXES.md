# Branch-Specific Fixes Needed

## Repository Structure
- **Agent Code Repo**: `https://github.com/xaviersharwin10/gitAgent.git`
- **Branches**: `main`, `aggressive`, `moderate`

## Fixes Required Per Branch

### 1. MODERATE Branch (`moderate`)
**File**: `agent.ts` (lines 198-222)

**Current Issue**: Using conservative filter (price < $0.38) instead of moderate threshold ($0.42)

**Fix**:
```typescript
if (isBuy) {
  console.log(`[AI Decision] AI decided: BUY.`);
  
  // Moderate strategy: Execute trades when price is below $0.42 (moderate threshold)
  const priceBelowThreshold = price < 0.42; // Moderate threshold
  const shouldExecuteTrade = priceBelowThreshold;
  
  if (shouldExecuteTrade) {
    console.log(`[Trade] ✅ Moderate filter passed (price: $${price.toFixed(4)} below $0.42 threshold). Executing trade...`);
    const tradeResult = await executeTradeOnSomnia();
    // ... rest of trade execution
  } else {
    console.log(`[Trade] 🛡️ Moderate filter blocked trade execution (price: $${price.toFixed(4)} above $0.42 threshold). Holding instead.`);
    await sendMetric(`BUY (FILTERED) - ${decision}`, price, false, null, null);
  }
}
```

### 2. AGGRESSIVE Branch (`aggressive`)
**File**: `agent.ts`

**Current Issue**: LLM giving confused HOLD responses instead of clear decisions

**Fixes Needed**:

**A. Update prompt** (line 9):
```typescript
const agentPrompt = process.env.AI_PROMPT || "You are a crypto trading bot analyzing SOMI token price. Respond with ONLY 'BUY' or 'HOLD' based on the current price. BUY if you see any positive signal or the price seems reasonable. HOLD only if there's a clear bearish trend. Keep your response brief - just the decision word.";
```

**B. Update user message** (line 188):
```typescript
{ role: 'user', content: `SOMI token price: $${price.toFixed(4)}. Should I BUY or HOLD? Respond with only 'BUY' or 'HOLD'.` }
```

**C. Reduce max_tokens** (line 192):
```typescript
max_tokens: 20, // Shorter response to get cleaner decisions
```

### 3. MAIN Branch (`main`)
**Status**: ✅ Already correct - conservative filter (price < $0.38 or 30% random)

## How to Apply Fixes

1. **Clone the gitAgent repo** (if not already):
   ```bash
   cd /tmp
   git clone https://github.com/xaviersharwin10/gitAgent.git
   cd gitAgent
   ```

2. **Fix MODERATE branch**:
   ```bash
   git checkout moderate
   # Edit agent.ts with moderate filter ($0.42)
   git add agent.ts
   git commit -m "fix: moderate agent filter threshold to $0.42"
   git push origin moderate
   ```

3. **Fix AGGRESSIVE branch**:
   ```bash
   git checkout aggressive
   # Edit agent.ts with improved prompt and max_tokens
   git add agent.ts
   git commit -m "fix: improve aggressive agent prompt for clearer BUY/HOLD decisions"
   git push origin aggressive
   ```

4. **Verify MAIN branch** (should already be correct):
   ```bash
   git checkout main
   # Verify it has conservative filter (price < $0.38 or 30% random)
   ```

## After Pushing
- Webhook will automatically trigger deployment
- Backend will clone the updated branch code
- Agents will restart with new logic

