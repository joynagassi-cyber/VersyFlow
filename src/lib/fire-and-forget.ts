/**
 * `fireAndForget` — hand an async task to a slot that expects `void`.
 *
 * React event props (`onClick`, `onChange`, `onSubmit`…) are typed as
 * `(event) => void`. Passing an `async` handler straight to them compiles,
 * but the returned promise is then dropped on the floor: a rejection becomes
 * an unhandled promise rejection that surfaces as a console error (or as a
 * crash under strict Node settings) far away from the click that caused it.
 *
 * `void handler()` silences the lint rule without fixing that. This helper
 * keeps the promise *and* reports the failure where it happened, which is the
 * only thing a click handler can honestly do: the user is not awaiting it.
 *
 * Usage:
 *   onClick={() => fireAndForget(signOut(), 'settings:signOut')}
 */
export function fireAndForget(task: Promise<unknown>, context: string): void {
  task.catch((error: unknown) => {
    console.error(`[fireAndForget] ${context} failed:`, error);
  });
}
