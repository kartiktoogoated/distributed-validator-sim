use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorInfo {
    pub validator_address: String,
    pub stake: u64,
    pub is_active: bool,
    pub last_update_timestamp: DateTime<Utc>,
}

#[derive(Debug)]
pub struct Validator {
    validators: HashMap<String, ValidatorInfo>,
    minimum_stake: u64,
}

impl Validator {
    pub fn new(minimum_stake: u64) -> Self {
        Self {
            validators: HashMap::new(),
            minimum_stake,
        }
    }

    pub fn register_validator(&mut self, address: String, stake: u64) -> Result<(), String> {
        if self.validators.contains_key(&address) {
            return Err("Validator already registered".to_string());
        }

        if stake < self.minimum_stake {
            return Err("Insufficient stake amount".to_string());
        }

        self.validators.insert(
            address.clone(),
            ValidatorInfo {
                validator_address: address,
                stake,
                is_active: true,
                last_update_timestamp: Utc::now(),
            },
        );

        Ok(())
    }

    pub fn unregister_validator(&mut self, address: &str) -> Result<u64, String> {
        let validator = self.validators.get_mut(address)
            .ok_or_else(|| "Validator not found".to_string())?;

        if !validator.is_active {
            return Err("Validator already unregistered".to_string());
        }

        validator.is_active = false;
        Ok(validator.stake)
    }

    pub fn update_stake(&mut self, address: &str, additional_stake: u64) -> Result<(), String> {
        let validator = self.validators.get_mut(address)
            .ok_or_else(|| "Validator not found".to_string())?;

        if !validator.is_active {
            return Err("Validator is not active".to_string());
        }

        validator.stake += additional_stake;
        validator.last_update_timestamp = Utc::now();
        Ok(())
    }

    pub fn get_validator_info(&self, address: &str) -> Option<&ValidatorInfo> {
        self.validators.get(address)
    }

    pub fn is_validator_active(&self, address: &str) -> bool {
        self.validators.get(address)
            .map(|v| v.is_active)
            .unwrap_or(false)
    }
} 