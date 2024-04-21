import type { Json, JsonRpcRequest } from '@metamask/utils';
/**
 * The cache strategy to use for a given method.
 */
export declare enum CacheStrategy {
    /**
     * Cache per-block.
     */
    Block = "block",
    /**
     * Cache until a chain reorganization occurs.
     */
    Fork = "fork",
    /**
     * Never cache.
     */
    Never = "never",
    /**
     * Permanently cache.
     */
    Permanent = "perma"
}
/**
 * Return a cache identifier for the given request.
 *
 * This identifier should include any request details that might impact the
 * response, with the exception of the block parameter if the `skipBlockRef`
 * option is set,
 *
 * If the request cannot be cached, this will return `null`.
 *
 * @param request - The JSON-RPC request.
 * @param skipBlockRef - Skip the block parameter when generating the cache
 * identifier.
 * @returns The cache identifier for this request, or `null` if it can't be
 * cached.
 */
export declare function cacheIdentifierForRequest(request: JsonRpcRequest, skipBlockRef?: boolean): string | null;
/**
 * Return whether a method can be cached or not.
 *
 * @param method - The method to check.
 * @returns Whether the method can be cached.
 */
export declare function canCache(method: string): boolean;
/**
 * Return the block parameter for the given request, if it has one.
 *
 * @param request - The JSON-RPC request.
 * @returns The block parameter in the given request, or `undefined` if none was found.
 */
export declare function blockTagForRequest(request: JsonRpcRequest): Json | undefined;
/**
 * Returns the index of the block parameter for the given method.
 *
 * @param method - A JSON-RPC method.
 * @returns The index of the block parameter for that method, or `undefined` if
 * there is no known block parameter.
 */
export declare function blockTagParamIndex(method: string): number | undefined;
/**
 * Return the cache type used for the given method.
 *
 * @param method - A JSON-RPC method.
 * @returns The cache type to use for that method.
 */
export declare function cacheTypeForMethod(method: string): CacheStrategy;
