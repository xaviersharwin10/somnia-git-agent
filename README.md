# GitAgent - On-Chain Infrastructure

This project implements the core on-chain infrastructure for GitAgent using Hardhat and Solidity. It provides a factory pattern for deploying and managing Agent contracts that can execute arbitrary calls and manage funds.

## Project Structure

```
GitFi/
├── contracts/
│   ├── Agent.sol           # Ownable vault/proxy contract
│   ├── AgentFactory.sol    # Factory for deploying Agent contracts
│   └── TestTarget.sol      # Test contract for testing execute functionality
├── scripts/
│   └── deploy.js           # Deployment script for Somnia testnet
├── test/
│   └── AgentFactory.test.js # Comprehensive test suite
├── hardhat.config.js       # Hardhat configuration
└── package.json            # Dependencies and scripts
```

## Contracts

### Agent.sol
A simple, ownable vault/proxy contract with the following features:
- **Owner Management**: Immutable owner address set at deployment
- **Access Control**: `onlyOwner` modifier for restricted functions
- **Fund Management**: `receive()` function to accept ETH, `withdraw()` to send funds
- **Execution**: `execute()` function for generic contract calls

### AgentFactory.sol
Factory contract for deploying and tracking Agent contracts:
- **Agent Registration**: Maps branch hashes to deployed agent addresses
- **Event Emission**: Emits `AgentRegistered` events for tracking
- **Duplicate Prevention**: Prevents registering the same branch hash twice

## Features

- ✅ **Ownable Agent Contracts**: Each agent has a designated owner
- ✅ **Fund Management**: Agents can receive and withdraw ETH
- ✅ **Generic Execution**: Agents can execute arbitrary contract calls
- ✅ **Factory Pattern**: Centralized deployment and tracking of agents
- ✅ **Event Tracking**: Comprehensive event emission for monitoring
- ✅ **Access Control**: Owner-only functions with proper modifiers
- ✅ **Comprehensive Testing**: Full test coverage for all functionality

## Getting Started

### Prerequisites
- Node.js (version 20+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Compilation
```bash
npm run compile
```

### Testing
```bash
npm test
```

### Local Deployment
```bash
npm run deploy:local
```

### Somnia Testnet Deployment
```bash
# Set your private key in environment variable
export PRIVATE_KEY="your-private-key-here"
npm run deploy
```

## Usage

### Deploying an Agent
```javascript
const factory = await ethers.getContractAt("AgentFactory", factoryAddress);
const branchHash = ethers.id("my-repo/main");
const tx = await factory.registerAgent(branchHash);
const receipt = await tx.wait();
const agentAddress = await factory.agents(branchHash);
```

### Using an Agent
```javascript
const agent = await ethers.getContractAt("Agent", agentAddress);

// Send ETH to agent
await owner.sendTransaction({
  to: agentAddress,
  value: ethers.parseEther("1.0")
});

// Withdraw funds
await agent.withdraw(recipientAddress, ethers.parseEther("0.5"));

// Execute arbitrary call
const data = targetContract.interface.encodeFunctionData("functionName", [args]);
const response = await agent.execute(targetAddress, data);
```

## Network Configuration

The project is configured for:
- **Hardhat Local Network**: For development and testing
- **Somnia Testnet**: For testnet deployment (Chain ID: 1946)

## Test Coverage

The test suite covers:
- ✅ Agent registration and mapping
- ✅ Event emission verification
- ✅ Owner assignment validation
- ✅ Duplicate registration prevention
- ✅ Execute function access control
- ✅ Fund management functionality
- ✅ ETH receiving capability

## Security Features

- **Access Control**: All sensitive functions are protected by `onlyOwner` modifier
- **Input Validation**: Proper checks for sufficient balance and valid addresses
- **Error Handling**: Clear error messages for failed operations
- **Immutable Ownership**: Owner address cannot be changed after deployment

## License

MIT License - see SPDX-License-Identifier in contract files.

