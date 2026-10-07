/* tslint:disable */
/* eslint-disable */

export class WasmFsrsEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Human-readable explanations for each parameter (UI tooltips).
     */
    explain(state: any, rating: number): any;
    /**
     * Indices (as strings, matching the TS bridge's `verse-N` convention)
     * of items that are due for review.
     */
    get_due_items(states: any, _now: bigint): any;
    constructor();
    /**
     * Initial state for a brand-new item: run `next_states(None, retention, 0)`
     * and take the "good" branch (matches the TS adapter's `newState`).
     */
    new_state(requested_retention: number): any;
    /**
     * Process one review: `rating` 1..=4, `state` is the current domain
     * `FsrsState` as a JS object. Returns `{ state, due, stability,
     * scheduledDays, recurring }`.
     */
    review(state: any, rating: number): any;
}

export function initialize(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmfsrsengine_free: (a: number, b: number) => void;
    readonly initialize: () => void;
    readonly wasmfsrsengine_explain: (a: number, b: any, c: number) => [number, number, number];
    readonly wasmfsrsengine_get_due_items: (a: number, b: any, c: bigint) => [number, number, number];
    readonly wasmfsrsengine_new: () => [number, number, number];
    readonly wasmfsrsengine_new_state: (a: number, b: number) => any;
    readonly wasmfsrsengine_review: (a: number, b: any, c: number) => any;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
