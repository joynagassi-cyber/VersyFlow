use js_sys::{Array, Date, Object, Reflect};
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;
use fsrs::{FSRS, ItemState, MemoryState, NextStates};

#[wasm_bindgen]
pub fn initialize() {
    // No-op initialization hook; the crate itself is pure math.
}

fn obj_get_number(obj: &Object, key: &str) -> Option<f32> {
    let raw = Reflect::get(obj, &JsValue::from_str(key)).ok()?;
    raw.as_f64().map(|f| f as f32).filter(|v| v.is_finite())
}

fn new_state_js(
    stability: f32,
    difficulty: f32,
    last_interval: f32,
    next_interval: f32,
    elapsed_days: f32,
    repetitions: f32,
    requested_retention: f32,
) -> JsValue {
    let obj = Object::new();
    let _ = Reflect::set(&obj, &JsValue::from_str("stability"), &JsValue::from(stability));
    let _ = Reflect::set(
        &obj,
        &JsValue::from_str("difficulty"),
        &JsValue::from(difficulty),
    );
    let _ = Reflect::set(
        &obj,
        &JsValue::from_str("recallProbability"),
        &JsValue::from(0.0_f32),
    );
    let _ = Reflect::set(
        &obj,
        &JsValue::from_str("lastInterval"),
        &JsValue::from(last_interval),
    );
    let _ = Reflect::set(
        &obj,
        &JsValue::from_str("nextInterval"),
        &JsValue::from(next_interval),
    );
    let _ = Reflect::set(
        &obj,
        &JsValue::from_str("elapsedDays"),
        &JsValue::from(elapsed_days),
    );
    let _ = Reflect::set(
        &obj,
        &JsValue::from_str("repetitions"),
        &JsValue::from(repetitions),
    );
    let _ = Reflect::set(
        &obj,
        &JsValue::from_str("requestedRetention"),
        &JsValue::from(requested_retention),
    );
    JsValue::from(obj)
}

fn empty_next_states() -> NextStates {
    let zero = ItemState {
        memory: MemoryState {
            stability: 0.0,
            difficulty: 0.0,
        },
        interval: 0.0,
    };
    NextStates {
        again: zero.clone(),
        hard: zero.clone(),
        good: zero.clone(),
        easy: zero,
    }
}

#[wasm_bindgen]
pub struct WasmFsrsEngine {
    inner: FSRS,
}

#[wasm_bindgen]
impl WasmFsrsEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmFsrsEngine, JsValue> {
        Ok(WasmFsrsEngine {
            inner: FSRS::default(),
        })
    }

    /// Initial state for a brand-new item: run `next_states(None, retention, 0)`
    /// and take the "good" branch (matches the TS adapter's `newState`).
    pub fn new_state(&self, requested_retention: f32) -> JsValue {
        let desired = requested_retention.clamp(0.01, 1.0);
        let next = self
            .inner
            .next_states(None, desired, 0)
            .unwrap_or_else(|_| empty_next_states());
        let good = next.good;
        new_state_js(
            good.memory.stability,
            good.memory.difficulty,
            0.0,
            good.interval,
            0.0,
            0.0,
            desired,
        )
    }

    /// Process one review: `rating` 1..=4, `state` is the current domain
    /// `FsrsState` as a JS object. Returns `{ state, due, stability,
    /// scheduledDays, recurring }`.
    pub fn review(&self, state: &JsValue, rating: u32) -> JsValue {
        if !state.is_instance_of::<Object>() {
            return JsValue::UNDEFINED;
        }
        let obj = state.unchecked_ref::<Object>().clone();
        let desired = obj_get_number(&obj, "requestedRetention")
            .unwrap_or(0.9)
            .clamp(0.01, 1.0);
        let elapsed_days = obj_get_number(&obj, "elapsedDays").unwrap_or(0.0) as u32;
        let prev = MemoryState {
            stability: obj_get_number(&obj, "stability").unwrap_or(0.0),
            difficulty: obj_get_number(&obj, "difficulty").unwrap_or(0.0),
        };
        let rating = rating.clamp(1, 4);
        let chosen = match self
            .inner
            .next_states(Some(prev), desired, elapsed_days)
        {
            Ok(next) => match rating {
                1 => next.again,
                2 => next.hard,
                3 => next.good,
                _ => next.easy,
            },
            Err(_) => ItemState {
                memory: prev,
                interval: 0.0,
            },
        };

        let interval = chosen.interval.max(0.0);
        let now_ms = Date::now();
        let due_ms = now_ms + (interval as f64) * 86_400_000.0;
        let due = Date::new(&JsValue::from_f64(due_ms));

        let new_state_val = new_state_js(
            chosen.memory.stability,
            chosen.memory.difficulty,
            elapsed_days as f32,
            interval,
            0.0,
            0.0,
            desired,
        );

        let out = Object::new();
        let _ = Reflect::set(&out, &JsValue::from_str("state"), &new_state_val);
        let _ = Reflect::set(&out, &JsValue::from_str("due"), &due);
        let _ = Reflect::set(
            &out,
            &JsValue::from_str("stability"),
            &JsValue::from(chosen.memory.stability),
        );
        let _ = Reflect::set(
            &out,
            &JsValue::from_str("scheduledDays"),
            &JsValue::from(interval),
        );
        let _ = Reflect::set(
            &out,
            &JsValue::from_str("recurring"),
            &JsValue::from(interval > 0.0),
        );
        JsValue::from(out)
    }

    /// Human-readable explanations for each parameter (UI tooltips).
    pub fn explain(
        &self,
        state: &JsValue,
        rating: u32,
    ) -> Result<JsValue, JsValue> {
        if !state.is_instance_of::<Object>() {
            return Err(JsValue::from_str("state must be a plain object"));
        }
        let obj = state.unchecked_ref::<Object>();
        let desired = obj_get_number(obj, "requestedRetention")
            .unwrap_or(0.9)
            .clamp(0.01, 1.0);
        let prev = MemoryState {
            stability: obj_get_number(obj, "stability").unwrap_or(0.0),
            difficulty: obj_get_number(obj, "difficulty").unwrap_or(0.0),
        };
        let rating = rating.clamp(1, 4);
        let chosen = self
            .inner
            .next_states(Some(prev), desired, 0)
            .map(|next| match rating {
                1 => next.again,
                2 => next.hard,
                3 => next.good,
                _ => next.easy,
            })
            .unwrap_or(ItemState {
                memory: prev,
                interval: 0.0,
            });

        let out = Object::new();
        let _ = Reflect::set(
            &out,
            &JsValue::from_str("stability"),
            &JsValue::from(format!(
                "Days until P(recall) = {desired:.2}: {:.2}",
                chosen.memory.stability
            )),
        );
        let _ = Reflect::set(
            &out,
            &JsValue::from_str("difficulty"),
            &JsValue::from(format!(
                "Difficulty level: {:.2}/10",
                chosen.memory.difficulty
            )),
        );
        let _ = Reflect::set(
            &out,
            &JsValue::from_str("recallProbability"),
            &JsValue::from(format!("Current recall probability: {desired:.2}")),
        );
        Ok(JsValue::from(out))
    }

    /// Indices (as strings, matching the TS bridge's `verse-N` convention)
    /// of items that are due for review.
    pub fn get_due_items(&self, states: &JsValue, _now: i64) -> Result<JsValue, JsValue> {
        let arr: &Array = states.unchecked_ref::<Array>();
        let out = Array::new();
        let len = arr.length() as usize;
        for i in 0..len {
            let item = &arr.get(i as u32);
            if !item.is_instance_of::<Object>() {
                continue;
            }
            let obj = item.unchecked_ref::<Object>();
            let last_interval = obj_get_number(obj, "lastInterval").unwrap_or(0.0);
            let elapsed_days = obj_get_number(obj, "elapsedDays").unwrap_or(0.0);
            if last_interval > 0.0 && elapsed_days >= last_interval {
                out.push(&JsValue::from(format!("verse-{i}")));
            }
        }
        Ok(JsValue::from(out))
    }
}
