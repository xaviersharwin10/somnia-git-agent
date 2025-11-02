// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Agent {
    address public immutable owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    receive() external payable {}

    function withdraw(address payable _to, uint _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        _to.transfer(_amount);
    }

    function execute(address _target, bytes calldata _data) public onlyOwner returns (bytes memory response) {
        (bool success, bytes memory data) = _target.call(_data);
        require(success, "Call failed");
        return data;
    }
}

