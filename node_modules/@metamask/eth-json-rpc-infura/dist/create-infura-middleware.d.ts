import type { Json, JsonRpcParams } from '@metamask/utils';
import type { InfuraJsonRpcSupportedNetwork } from './types';
export declare type CreateInfuraMiddlewareOptions = {
    network?: InfuraJsonRpcSupportedNetwork;
    maxAttempts?: number;
    source?: string;
    projectId: string;
    headers?: Record<string, string>;
};
/**
 * Builds [`@metamask/json-rpc-engine`](https://github.com/MetaMask/@metamask/json-rpc-engine)-compatible middleware designed
 * for interfacing with Infura's JSON-RPC endpoints.
 * @param opts - The options.
 * @param opts.network - A network that Infura supports; plugs into
 * `https://${network}.infura.io` (default: 'mainnet').
 * @param opts.maxAttempts - The number of times a request to Infura should be
 * retried in the case of failure (default: 5).
 * @param opts.source - A descriptor for the entity making the request; tracked
 * by Infura for analytics purposes.
 * @param opts.projectId - The Infura project id.
 * @param opts.headers - Extra headers that will be used to make the request.
 * @returns The `@metamask/json-rpc-engine`-compatible middleware.
 */
export declare function createInfuraMiddleware({ network, maxAttempts, source, projectId, headers, }: CreateInfuraMiddlewareOptions): import("@metamask/json-rpc-engine").JsonRpcMiddleware<JsonRpcParams, Json>;
