// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IValidator.sol";

contract Validator is IValidator {
    mapping(address => ValidatorInfo) private validators;
    uint256 public constant MINIMUM_STAKE = 1 ether;

    modifier onlyActiveValidator() {
        require(validators[msg.sender].isActive, "Not an active validator");
        _;
    }

    modifier onlyInactiveValidator() {
        require(!validators[msg.sender].isActive, "Already registered as validator");
        _;
    }

    function registerValidator() external payable override onlyInactiveValidator {
        require(msg.value >= MINIMUM_STAKE, "Insufficient stake amount");
        
        validators[msg.sender] = ValidatorInfo({
            validatorAddress: msg.sender,
            stake: msg.value,
            isActive: true,
            lastUpdateTimestamp: block.timestamp
        });

        emit ValidatorRegistered(msg.sender, msg.value);
    }

    function unregisterValidator() external override onlyActiveValidator {
        uint256 stake = validators[msg.sender].stake;
        validators[msg.sender].isActive = false;
        
        (bool success, ) = msg.sender.call{value: stake}("");
        require(success, "Stake return failed");

        emit ValidatorUnregistered(msg.sender);
    }

    function updateStake() external payable override onlyActiveValidator {
        require(msg.value > 0, "Must send stake amount");
        
        validators[msg.sender].stake += msg.value;
        validators[msg.sender].lastUpdateTimestamp = block.timestamp;

        emit StakeUpdated(msg.sender, validators[msg.sender].stake);
    }

    function getValidatorInfo(address validator) external view override returns (ValidatorInfo memory) {
        return validators[validator];
    }

    function isValidatorActive(address validator) external view override returns (bool) {
        return validators[validator].isActive;
    }
} 