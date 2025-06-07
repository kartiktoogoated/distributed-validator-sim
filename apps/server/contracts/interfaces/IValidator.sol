// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IValidator {
    struct ValidatorInfo {
        address validatorAddress;
        uint256 stake;
        bool isActive;
        uint256 lastUpdateTimestamp;
    }

    event ValidatorRegistered(address indexed validator, uint256 stake);
    event ValidatorUnregistered(address indexed validator);
    event StakeUpdated(address indexed validator, uint256 newStake);

    function registerValidator() external payable;
    function unregisterValidator() external;
    function updateStake() external payable;
    function getValidatorInfo(address validator) external view returns (ValidatorInfo memory);
    function isValidatorActive(address validator) external view returns (bool);
} 