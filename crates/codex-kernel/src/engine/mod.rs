use std::collections::{HashMap, HashSet, VecDeque};
use std::time::{Duration, Instant};

use crate::credentials::{Account, CredentialFile};
use crate::error::KernelError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SendState {
    NotSent,
    Sent,
}

#[derive(Debug, Clone)]
pub struct Attempt {
    pub account_id: String,
    pub sticky: bool,
    pub send: SendState,
    pub committed: bool,
}

impl Attempt {
    pub fn new(account_id: String, sticky: bool) -> Self {
        Self {
            account_id,
            sticky,
            send: SendState::NotSent,
            committed: false,
        }
    }

    pub fn mark_sent(&mut self) {
        self.send = SendState::Sent;
    }

    pub fn commit(&mut self) {
        self.send = SendState::Sent;
        self.committed = true;
    }

    pub fn can_retry_other(&self) -> bool {
        self.send == SendState::NotSent && !self.sticky && !self.committed
    }
}

#[derive(Debug, Default)]
pub struct Scheduler {
    by_previous: HashMap<String, String>,
    by_session: HashMap<String, String>,
    in_flight: HashMap<String, u32>,
    rpm_hits: HashMap<String, VecDeque<Instant>>,
}

#[derive(Debug, Clone)]
pub struct ScheduleDecision {
    pub account_id: String,
    pub sticky: bool,
}

impl Scheduler {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn select(
        &mut self,
        file: &CredentialFile,
        previous_response_id: Option<&str>,
        session_id: Option<&str>,
        excluded: &HashSet<String>,
    ) -> Result<ScheduleDecision, KernelError> {
        if let Some(prev) = nonempty(previous_response_id) {
            if let Some(id) = self.by_previous.get(prev).cloned() {
                if excluded.contains(&id) {
                    return Err(KernelError::StickyUnavailable);
                }
                if file.get(&id).is_some() && self.can_take(file.get(&id).unwrap()) {
                    self.hold(&id);
                    return Ok(ScheduleDecision {
                        account_id: id,
                        sticky: true,
                    });
                }
                return Err(KernelError::StickyUnavailable);
            }
        }
        if let Some(sid) = nonempty(session_id) {
            if let Some(id) = self.by_session.get(sid).cloned() {
                if !excluded.contains(&id)
                    && file.get(&id).is_some()
                    && self.can_take(file.get(&id).unwrap())
                {
                    self.hold(&id);
                    return Ok(ScheduleDecision {
                        account_id: id,
                        sticky: true,
                    });
                }
            }
        }

        let mut best: Option<(&Account, usize)> = None;
        let mut has_token = false;
        for account in &file.accounts {
            if !account.access_token.trim().is_empty() {
                has_token = true;
            }
            if excluded.contains(&account.id) || !self.can_take(account) {
                continue;
            }
            let sessions = self.session_count(&account.id);
            match best {
                None => best = Some((account, sessions)),
                Some((_, n)) if sessions < n => best = Some((account, sessions)),
                _ => {}
            }
        }
        let account = match best {
            Some((account, _)) => account,
            None if has_token => return Err(KernelError::Busy),
            None => return Err(KernelError::NoCredential),
        };
        self.hold(&account.id);
        Ok(ScheduleDecision {
            account_id: account.id.clone(),
            sticky: false,
        })
    }

    pub fn commit_success(
        &mut self,
        account_id: &str,
        previous_response_id: Option<&str>,
        session_id: Option<&str>,
    ) {
        if let Some(prev) = nonempty(previous_response_id) {
            self.by_previous
                .insert(prev.to_string(), account_id.to_string());
        }
        if let Some(sid) = nonempty(session_id) {
            self.by_session
                .insert(sid.to_string(), account_id.to_string());
        }
        self.release(account_id);
        self.record_rpm(account_id);
    }

    pub fn abort(&mut self, account_id: &str) {
        self.release(account_id);
    }

    pub fn session_count(&self, account_id: &str) -> usize {
        self.by_session
            .values()
            .filter(|id| *id == account_id)
            .count()
    }

    fn hold(&mut self, account_id: &str) {
        *self.in_flight.entry(account_id.to_string()).or_insert(0) += 1;
    }

    fn release(&mut self, account_id: &str) {
        if let Some(n) = self.in_flight.get_mut(account_id) {
            if *n > 0 {
                *n -= 1;
            }
        }
    }

    fn can_take(&mut self, account: &Account) -> bool {
        if account.access_token.trim().is_empty() {
            return false;
        }
        let flying = *self.in_flight.get(&account.id).unwrap_or(&0);
        if account.max_concurrency > 0 && flying >= account.max_concurrency {
            return false;
        }
        if account.rpm > 0 {
            self.prune_rpm(&account.id);
            let hits = self.rpm_hits.get(&account.id).map(|q| q.len()).unwrap_or(0);
            if hits as u32 >= account.rpm {
                return false;
            }
        }
        true
    }

    fn record_rpm(&mut self, account_id: &str) {
        self.rpm_hits
            .entry(account_id.to_string())
            .or_default()
            .push_back(Instant::now());
    }

    fn prune_rpm(&mut self, account_id: &str) {
        let cutoff = Instant::now() - Duration::from_secs(60);
        if let Some(q) = self.rpm_hits.get_mut(account_id) {
            while q.front().is_some_and(|t| *t < cutoff) {
                q.pop_front();
            }
        }
    }
}

fn nonempty(value: Option<&str>) -> Option<&str> {
    value.map(str::trim).filter(|s| !s.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn file(ids: &[&str]) -> CredentialFile {
        CredentialFile {
            accounts: ids
                .iter()
                .map(|id| Account {
                    id: (*id).into(),
                    access_token: "tok".into(),
                    refresh_token: String::new(),
                    id_token: String::new(),
                    expires_at: 0,
                    chatgpt_account_id: "acc".into(),
                    rpm: 0,
                    max_concurrency: 4,
                })
                .collect(),
        }
    }

    #[test]
    fn splits_new_sessions_by_count() {
        let file = file(&["a", "b"]);
        let mut s = Scheduler::new();
        let excluded = HashSet::new();
        let first = s.select(&file, None, Some("s1"), &excluded).unwrap();
        s.commit_success(&first.account_id, None, Some("s1"));
        let second = s.select(&file, None, Some("s2"), &excluded).unwrap();
        assert_ne!(first.account_id, second.account_id);
    }

    #[test]
    fn session_sticky() {
        let file = file(&["a", "b"]);
        let mut s = Scheduler::new();
        let excluded = HashSet::new();
        let first = s.select(&file, None, Some("s1"), &excluded).unwrap();
        s.commit_success(&first.account_id, Some("resp_1"), Some("s1"));
        let again = s.select(&file, None, Some("s1"), &excluded).unwrap();
        assert_eq!(again.account_id, first.account_id);
        assert!(again.sticky);
        s.abort(&again.account_id);
    }

    #[test]
    fn previous_response_hard_sticky() {
        let file = file(&["a", "b"]);
        let mut s = Scheduler::new();
        let excluded = HashSet::new();
        let first = s.select(&file, None, Some("s1"), &excluded).unwrap();
        s.commit_success(&first.account_id, Some("resp_9"), Some("s1"));
        let again = s
            .select(&file, Some("resp_9"), Some("other"), &excluded)
            .unwrap();
        assert_eq!(again.account_id, first.account_id);
        s.abort(&again.account_id);
    }

    #[test]
    fn not_sent_can_retry_other_account() {
        let mut attempt = Attempt::new("a".into(), false);
        assert!(attempt.can_retry_other());
        attempt.mark_sent();
        assert!(!attempt.can_retry_other());
    }

    #[test]
    fn commit_forbids_retry() {
        let mut attempt = Attempt::new("a".into(), false);
        attempt.commit();
        assert!(!attempt.can_retry_other());
        assert!(attempt.committed);
        assert_eq!(attempt.send, SendState::Sent);
    }

    #[test]
    fn sticky_never_retries_other() {
        let attempt = Attempt::new("a".into(), true);
        assert!(!attempt.can_retry_other());
    }

    #[test]
    fn excluded_not_sent_picks_next() {
        let file = file(&["a", "b"]);
        let mut s = Scheduler::new();
        let mut excluded = HashSet::new();
        let first = s.select(&file, None, None, &excluded).unwrap();
        s.abort(&first.account_id);
        excluded.insert(first.account_id.clone());
        let second = s.select(&file, None, None, &excluded).unwrap();
        assert_ne!(second.account_id, first.account_id);
    }

    #[test]
    fn empty_file_is_no_credential() {
        let file = file(&[]);
        let mut s = Scheduler::new();
        let excluded = HashSet::new();
        let err = s.select(&file, None, None, &excluded).unwrap_err();
        assert!(matches!(err, KernelError::NoCredential));
    }

    #[test]
    fn concurrency_cap_is_busy_not_missing() {
        let file = CredentialFile {
            accounts: vec![Account {
                id: "a".into(),
                access_token: "tok".into(),
                refresh_token: String::new(),
                id_token: String::new(),
                expires_at: 0,
                chatgpt_account_id: "acc".into(),
                rpm: 0,
                max_concurrency: 1,
            }],
        };
        let mut s = Scheduler::new();
        let excluded = HashSet::new();
        let first = s.select(&file, None, None, &excluded).unwrap();
        let err = s.select(&file, None, None, &excluded).unwrap_err();
        assert!(matches!(err, KernelError::Busy));
        s.abort(&first.account_id);
        assert!(s.select(&file, None, None, &excluded).is_ok());
    }
}
