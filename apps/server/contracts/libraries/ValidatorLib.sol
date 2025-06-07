// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library ValidatorLib {
    struct ValidatorStats {
        uint256 totalStake;
        uint256 activeValidators;
        uint256 totalValidators;
    }

    function calculateValidatorScore(
        uint256 stake,
        uint256 uptime,
        uint256 performance
    ) internal pure returns (uint256) {
        // Simple scoring mechanism based on stake, uptime, and performance
        return (stake * uptime * performance) / 100;
    }

    function isEligibleForReward(
        uint256 stake,
        uint256 minimumStake,
        uint256 lastUpdateTimestamp,
        uint256 maxInactiveTime
    ) internal view returns (bool) {
        return (
            stake >= minimumStake &&
            block.timestamp - lastUpdateTimestamp <= maxInactiveTime
        );
    }

    function calculateReward(
        uint256 stake,
        uint256 rewardRate,
        uint256 timeElapsed
    ) internal pure returns (uint256) {
        return (stake * rewardRate * timeElapsed) / (365 days);
    }
} 