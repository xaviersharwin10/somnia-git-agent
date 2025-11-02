# 🔧 RPC Connection Troubleshooting

## Error: `getaddrinfo EAI_AGAIN dream-rpc.somnia.network`

This error means the backend can't resolve the DNS for the Somnia RPC endpoint.

## Solutions

### 1. **Check Internet Connection**
```bash
ping dream-rpc.somnia.network
```

### 2. **Verify RPC URL is Correct**
The correct URL is: `https://dream-rpc.somnia.network`

Check your `.env` file:
```env
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
```

### 3. **Test RPC Connection Manually**
```bash
curl -X POST https://dream-rpc.somnia.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

If this works, the RPC is reachable and the issue might be:
- DNS caching
- Network firewall
- Intermittent connectivity

### 4. **Try Alternative RPC Endpoints**
Check Somnia documentation for alternative RPC URLs if the main one is down.

### 5. **Use Local Testnet (For Development)**
If RPC is consistently unavailable, you can:
1. Use Hardhat local network for testing
2. Update `SOMNIA_RPC_URL` to `http://localhost:8545`
3. Run `npx hardhat node` in another terminal

### 6. **Server Behavior**
With the updated code:
- ✅ Server will start even if RPC is unavailable
- ⚠️ Agent deployment will fail gracefully with error message
- ✅ Other endpoints (health, secrets, etc.) will still work
- ✅ Once RPC is available, next deployment will succeed

## Quick Fix

The server should now handle RPC errors gracefully. If you see this error:

1. **Don't panic** - The server keeps running
2. **Check your network** - Ensure you have internet connectivity
3. **Retry the push** - Once RPC is available, the next deployment will work
4. **Check logs** - The error message will tell you what went wrong

## Still Having Issues?

1. Check Somnia testnet status page
2. Try using a VPN (if DNS is blocked)
3. Wait a few minutes and retry (might be temporary DNS issue)
4. Consider using a different testnet for development
