use chrono::{DateTime, Duration, Utc};

#[derive(Debug)]
pub struct ValidatorStats {
    pub total_stake: u64,
    pub active_validators: usize,
    pub total_validators: usize,
}

pub fn calculate_validator_score(stake: u64, uptime: f64, performance: f64) -> u64 {
    // Simple scoring mechanism based on stake, uptime, and performance
    ((stake as f64 * uptime * performance) / 100.0) as u64
}

pub fn is_eligible_for_reward(
    stake: u64,
    minimum_stake: u64,
    last_update_timestamp: DateTime<Utc>,
    max_inactive_time: Duration,
) -> bool {
    stake >= minimum_stake && (Utc::now() - last_update_timestamp) <= max_inactive_time
}

pub fn calculate_reward(stake: u64, reward_rate: f64, time_elapsed: Duration) -> u64 {
    let days_elapsed = time_elapsed.num_seconds() as f64 / (24.0 * 3600.0);
    ((stake as f64 * reward_rate * days_elapsed) / 365.0) as u64
}

pub fn calculate_uptime(
    total_blocks: u64,
    missed_blocks: u64,
) -> f64 {
    if total_blocks == 0 {
        return 0.0;
    }
    (total_blocks - missed_blocks) as f64 / total_blocks as f64
}

pub fn calculate_performance(
    successful_validations: u64,
    total_validations: u64,
) -> f64 {
    if total_validations == 0 {
        return 0.0;
    }
    successful_validations as f64 / total_validations as f64
} 