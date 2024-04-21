import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
export interface PayloadWithOrigin extends JsonRpcRequest {
    origin?: string;
}
interface Request {
    method: string;
    headers: Record<string, string>;
    body: string;
}
interface FetchConfig {
    fetchUrl: string;
    fetchParams: Request;
}
/**
 * Create middleware for sending a JSON-RPC request to the given RPC URL.
 *
 * @param options - Options
 * @param options.btoa - Generates a base64-encoded string from a binary string.
 * @param options.fetch - The `fetch` function; expected to be equivalent to `window.fetch`.
 * @param options.rpcUrl - The URL to send the request to.
 * @param options.originHttpHeaderKey - If provider, the origin field for each JSON-RPC request
 * will be attached to each outgoing fetch request under this header.
 * @returns The fetch middleware.
 */
export declare function createFetchMiddleware({ btoa, fetch, rpcUrl, originHttpHeaderKey, }: {
    btoa: (stringToEncode: string) => string;
    fetch: typeof global.fetch;
    rpcUrl: string;
    originHttpHeaderKey?: string;
}): JsonRpcMiddleware<JsonRpcParams, Json>;
/**
 * Generate `fetch` configuration for sending the given request to an RPC API.
 *
 * @param options - Options
 * @param options.btoa - Generates a base64-encoded string from a binary string.
 * @param options.rpcUrl - The URL to send the request to.
 * @param options.originHttpHeaderKey - If provider, the origin field for each JSON-RPC request
 * will be attached to each outgoing fetch request under this header.
 * @param options.req
 * @returns The fetch middleware.
 */
export declare function createFetchConfigFromReq({ btoa, req, rpcUrl, originHttpHeaderKey, }: {
    btoa: (stringToEncode: string) => string;
    rpcUrl: string;
    originHttpHeaderKey?: string;
    req: PayloadWithOrigin;
}): FetchConfig;
export {};
