use wasm_bindgen::prelude::*;
use fsrs::{Fsrs, State, DurationExt};
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
pub fn initialize() {
    // WASM initialization
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FsrsState {
    pub stability: f64,
    pub difficulty: f64,
    pub recall_probability: f64,
    pub last_interval: i64,
    pub next_interval: i64,
    pub elapsed_days: i64,
    pub repetitions: i64,
    pub requested_retention: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FsrsReview {
    pub state: FsrsState,
    pub due: i64,
    pub stability: f64,
    pub scheduled_days: i64,
    pub recurring: bool,
}

#[wasm_bindgen]
pub struct WasmFsrsEngine {
    inner: Fsrs,
}

#[wasm_bindgen]
impl WasmFsrsEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmFsrsEngine, String> {
        let fsrs = Fsrs::new_ok();
        Ok(WasmFsrsEngine { inner: fsrs })
    }

    pub fn new_state(&self, _requested_retries: u32) -> Result<FsrsState, String> {
        let initial_state = self.inner.create_state(0.9);
        Ok(FsrsState {
            stability: initial_state.stability,
            difficulty: initial_state.difficulty,
            recall_probability: initial_state.recall_probability,
            last_interval: initial_state.last_interval,
            next_interval: initial_state.next_interval,
            elapsed_days: initial_state.elapsed_days,
            repetitions: initial_state.repetitions,
            requested_retention: initial_state.requested_retention,
        })
    }

    pub fn review(&self, state: &FsrsState, rating: u32) -> Result<FsrsReview, String> {
        let fsrs_state = State {
            stability: state.stability,
            difficulty: state.difficulty,
            recall_probability: state.recall_probability,
            last_interval: state.last_interval,
            next_interval: state.next_interval,
            elapsed_days: state.elapsed_days,
            repetitions: state.repetitions,
            requested_retention: state.requested_retention,
        };

        let review_result = self.inner.review(&fsrs_state, rating);

        Ok(FsrsReview {
            state: FsrsState {
                stability: review_result.state.stability,
                difficulty: review_result.state.difficulty,
                recall_probability: review_result.state.recall_probability,
                last_interval: review_result.state.last_interval,
                next_interval: review_result.state.next_interval,
                elapsed_days: review_result.state.elapsed_days,
                repetitions: review_result.state.repetitions,
                requested_retention: review_result.state.requested_retention,
            },
            due: review_result.due.as_ms(),
            stability: review_result.stability,
            scheduled_days: review_result.scheduled_days,
            recurring: review_result.recurring,
        })
    }

    pub fn explain(&self, state: &FsrsState, rating: u32) -> Result<js_sys::Object, String> {
        let mut explanations = js_sys::Object::new();
        js_sys::reflect_set(&explanations, "stability", &format!("Days until P(recall) = 0.9: {:.2}", state.stability));
        js_sys::reflect_set(&explanations, "difficulty", &format!("Difficulty level: {:.2}/10", state.difficulty));
        js_sys::reflect_set(&explanations, "recall_probability", &format!("Current recall probability: {:.2%}", state.recall_probability));
        Ok(explanations)
    }

    pub fn get_due_items(&self, states: &[FsrsState], now: i64) -> Result<Vec<String>, String> {
        let mut due_indices = Vec::new();
        for (i, state) in states.iter().enumerate() {
            if state.last_interval > 0 && state.elapsed_days >= state.last_interval {
                due_indices.push(i.to_string());
            }
        }
        Ok(due_indices)
    }
}
