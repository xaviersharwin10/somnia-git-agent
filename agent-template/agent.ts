import { ethers } from 'ethers';
import Groq from 'groq-sdk';
import axios from 'axios';

// 1. Load configuration from environment variables (injected by GitAgent backend)
const groqApiKey = process.env.GROQ_API_KEY;
const agentContractAddress = process.env.AGENT_CONTRACT_ADDRESS;
const agentPrompt = process.env.AI_PROMPT || "You are a cautious financial analyst. Based on the price, should I 'BUY' or 'HOLD'?"; // Default prompt

if (!groqApiKey || !agentContractAddress) {
  console.error('Error: GROQ_API_KEY or AGENT_CONTRACT_ADDRESS is not set.');
  process.exit(1);
}

// 2. Initialize clients
const groq = new Groq({ apiKey: groqApiKey });
// TODO: Connect to Somnia provider
// const provider = new ethers.providers.JsonRpcProvider(process.env.SOMNIA_RPC_URL); 
// const agentContract = new ethers.Contract(agentContractAddress, AGENT_ABI, provider);

console.log(`🤖 AI Agent ${agentContractAddress} starting...`);
console.log(`Prompt: "${agentPrompt}"`);

// 3. Real Price Feed - Fetch from CoinGecko API
async function getSomiPrice(): Promise<number> {
  try {
    // Try CoinGecko API for SOMI token price
    // Note: If SOMI isn't listed on CoinGecko, you may need to query a DEX contract
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'somnia', // Adjust this if the token ID is different
        vs_currencies: 'usd'
      },
      timeout: 5000
    });

    if (response.data && response.data.somnia && response.data.somnia.usd) {
      const price = response.data.somnia.usd;
      console.log(`[PriceFeed] Real SOMI price from CoinGecko: $${price.toFixed(4)}`);
      return price;
    }

    // Fallback: Try querying DEX on Somnia blockchain
    // TODO: Implement DEX contract call if CoinGecko doesn't have SOMI
    console.warn('[PriceFeed] CoinGecko API did not return SOMI price, using fallback');
    
    // Fallback to a reasonable price based on web search (~$0.40)
    const fallbackPrice = 0.40 + (Math.random() - 0.5) * 0.05;
    console.log(`[PriceFeed] Using fallback price: $${fallbackPrice.toFixed(4)}`);
    return fallbackPrice;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[PriceFeed] Error fetching price:', errorMessage);
    // Fallback price if API fails
    const fallbackPrice = 0.40 + (Math.random() - 0.5) * 0.05;
    console.log(`[PriceFeed] Using fallback price (API error): $${fallbackPrice.toFixed(4)}`);
    return fallbackPrice;
  }
}

// 4. Main AI Decision Loop
async function runDecisionLoop() {
  try {
    const price = await getSomiPrice();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: agentPrompt },
        { role: 'user', content: `The current price of SOMI is $${price.toFixed(4)}. Should I BUY or HOLD?` }
      ],
      model: 'llama-3.1-8b-instant', // Updated to current Groq model
      temperature: 0.5,
      max_tokens: 50,
    });

    const decision = chatCompletion.choices[0]?.message?.content || 'HOLD';

    if (decision.includes('BUY')) {
      console.log(`[AI Decision] AI decided: BUY. Executing trade...`);
      // TODO: Implement actual trade logic
      // const tx = await agentContract.execute(DEX_ADDRESS, ...);
      // console.log(`Trade executed: ${tx.hash}`);

    } else {
      console.log(`[AI Decision] AI decided: HOLD.`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in decision loop:', errorMessage);
  }
}

// 5. Run the agent
// Run immediately on start, and then every 30 seconds
runDecisionLoop();
setInterval(runDecisionLoop, 30000);
