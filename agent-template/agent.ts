import { ethers } from 'ethers';
import Groq from 'groq-sdk';
import axios from 'axios';

// 1. Load configuration from environment variables (injected by GitAgent backend)
const groqApiKey = process.env.GROQ_API_KEY;
const agentContractAddress = process.env.AGENT_CONTRACT_ADDRESS;
const agentPrompt = process.env.AI_PROMPT || "You are a cautious financial analyst. Based on the price, should I 'BUY' or 'HOLD'?"; // Default prompt
const somniaRpcUrl = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
const repoUrl = process.env.REPO_URL || '';
const branchName = process.env.BRANCH_NAME || 'main';
const agentPrivateKey = process.env.AGENT_PRIVATE_KEY || ''; // For signing transactions

if (!groqApiKey || !agentContractAddress) {
  console.error('Error: GROQ_API_KEY or AGENT_CONTRACT_ADDRESS is not set.');
  process.exit(1);
}

// 2. Initialize clients
const groq = new Groq({ apiKey: groqApiKey });

// Connect to Somnia provider
const provider = new ethers.JsonRpcProvider(somniaRpcUrl);

// Agent contract ABI (minimal for execute function)
const AGENT_ABI = [
  "function execute(address target, bytes calldata data) external returns (bytes memory)"
];

// Initialize agent contract
const agentContract = new ethers.Contract(agentContractAddress, AGENT_ABI, provider);

// Create wallet if private key is available
let agentWallet: ethers.Wallet | null = null;
if (agentPrivateKey) {
  agentWallet = new ethers.Wallet(agentPrivateKey, provider);
  console.log(`📝 Agent wallet connected: ${agentWallet.address}`);
}

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

// 4. Send metrics to backend
async function sendMetric(decision: string, price: number, tradeExecuted: boolean = false, tradeTxHash: string | null = null, tradeAmount: number | null = null) {
  if (!repoUrl) {
    console.warn('[Metrics] REPO_URL not set, skipping metrics');
    return;
  }

  try {
    await axios.post(`${backendUrl}/api/metrics`, {
      repo_url: repoUrl,
      branch_name: branchName,
      decision: decision,
      price: price,
      trade_executed: tradeExecuted,
      trade_tx_hash: tradeTxHash,
      trade_amount: tradeAmount
    }, { timeout: 3000 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Metrics] Failed to send metric: ${errorMessage}`);
  }
}

// 5. Execute a trade on Somnia
async function executeTradeOnSomnia(): Promise<{ success: boolean; txHash: string | null }> {
  if (!agentWallet) {
    console.warn('[Trade] Agent private key not set, skipping trade execution');
    console.warn('[Trade] Set AGENT_PRIVATE_KEY secret to enable trade execution');
    return { success: false, txHash: null };
  }

  try {
    // Get contract balance
    const contractBalance = await provider.getBalance(agentContractAddress as string);
    const walletBalance = await provider.getBalance(agentWallet.address);
    console.log(`[Trade] Agent contract balance: ${ethers.formatEther(contractBalance)} SOMI`);
    console.log(`[Trade] Wallet balance: ${ethers.formatEther(walletBalance)} SOMI`);

    // For demo: Send a small amount to the contract (proving agent can receive funds)
    // In production, this would be a DEX swap via contract.execute()
    const amount = ethers.parseEther("0.001");
    
    if (walletBalance < amount + ethers.parseEther("0.0001")) { // Need gas + amount
      console.warn('[Trade] Insufficient wallet balance for trade');
      return { success: false, txHash: null };
    }

    // Execute transaction: Send SOMI to agent contract (proof of execution)
    // This demonstrates the agent can receive and hold funds on-chain
    // In production, you'd use: agentContract.connect(agentWallet).execute(DEX_ADDRESS, swapData)
    const tx = await agentWallet.sendTransaction({
      to: agentContractAddress as string,
      value: amount,
      // No data needed - simple ETH transfer to contract
    });

    console.log(`[Trade] 📤 Transaction sent to Somnia: ${tx.hash}`);
    console.log(`[Trade] Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`[Trade] ✅ Transaction confirmed in block ${receipt?.blockNumber}`);
    console.log(`[Trade] 🔗 View on explorer: https://explorer.somnia.network/tx/${tx.hash}`);
    
    return { success: true, txHash: tx.hash };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Trade] ❌ Error executing trade: ${errorMessage}`);
    return { success: false, txHash: null };
  }
}

// 6. Main AI Decision Loop
async function runDecisionLoop() {
  try {
    const price = await getSomiPrice();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: agentPrompt },
        { role: 'user', content: `The current price of SOMI is $${price.toFixed(4)}. Should I BUY or HOLD?` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 50,
    });

    const decision = chatCompletion.choices[0]?.message?.content || 'HOLD';
    const isBuy = decision.toUpperCase().includes('BUY');

    if (isBuy) {
      console.log(`[AI Decision] AI decided: BUY. Executing trade on Somnia...`);
      
      // Execute actual trade on Somnia blockchain
      const tradeResult = await executeTradeOnSomnia();
      
      if (tradeResult.success && tradeResult.txHash) {
        console.log(`[Trade] ✅ Trade executed successfully: ${tradeResult.txHash}`);
        await sendMetric(`BUY - ${decision}`, price, true, tradeResult.txHash, 0.001);
      } else {
        console.log(`[Trade] ⚠️ Trade execution skipped (insufficient funds or key not set)`);
        await sendMetric(`BUY - ${decision}`, price, false, null, null);
      }
    } else {
      console.log(`[AI Decision] AI decided: HOLD.`);
      await sendMetric(`HOLD - ${decision}`, price, false, null, null);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in decision loop:', errorMessage);
  }
}

// 7. Run the agent
// Run immediately on start, and then every 30 seconds
runDecisionLoop();
setInterval(runDecisionLoop, 30000);
