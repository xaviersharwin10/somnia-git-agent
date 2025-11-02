// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Agent.sol";

contract AgentFactory {
    mapping(bytes32 => address) public agents;

    event AgentRegistered(address indexed owner, bytes32 indexed branchHash, address agentAddress);

    function registerAgent(bytes32 _branchHash) public returns (address agentAddress) {
        require(agents[_branchHash] == address(0), "Agent already registered");
        
        agentAddress = address(new Agent(msg.sender));
        agents[_branchHash] = agentAddress;
        
        emit AgentRegistered(msg.sender, _branchHash, agentAddress);
        
        return agentAddress;
    }
}

