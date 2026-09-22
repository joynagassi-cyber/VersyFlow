/**
 * Minimal ambient declaration for `node-fetch` (v2 CJS module).
 *
 * Only the handful of members actually used by this project's
 * cross-translation download script are declared, so that the script type-
 * checks without pulling in @types/node-fetch.
 */
declare module 'node-fetch' {
  export interface Response {
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
    headers: { get(name: string): string | null };
    text(): Promise<string>;
    json<T = unknown>(): Promise<T>;
    arrayBuffer(): Promise<ArrayBuffer>;
  }
  export interface RequestInit {
    method?: string;
    headers?: Record<string, string> | { get(name: string): string | null };
    body?: BodyInit | null;
    timeout?: number;
    redirect?: 'follow' | 'error' | 'manual';
  }
  export type BodyInit = string | ArrayBuffer | ReadableStream | FormData;
  export interface FetchOptions extends RequestInit {}
  export type FetchRequest = string | Request;
  export class Request {
    constructor(input: FetchRequest, init?: RequestInit);
    method: string;
    url: string;
    headers: { get(name: string): string | null };
  }
  export function fetch(
    input: FetchRequest,
    init?: FetchOptions
  ): Promise<Response>;
  export interface HeadersInit {
    get(name: string): string | null;
    [key: string]: unknown;
  }
  export class Headers {
    constructor(init?: HeadersInit | Record<string, string>);
    get(name: string): string | null;
    set(name: string, value: string): void;
    forEach(cb: (value: string, key: string) => void): void;
  }
  export type ProgressType = 'download' | 'upload';
  export interface ProgressEvent {
    loaded: number;
    total: number;
    percent: number;
    type: ProgressType;
  }
}
