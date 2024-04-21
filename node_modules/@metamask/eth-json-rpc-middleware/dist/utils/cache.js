"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheTypeForMethod = exports.blockTagParamIndex = exports.blockTagForRequest = exports.canCache = exports.cacheIdentifierForRequest = exports.CacheStrategy = void 0;
const safe_stable_stringify_1 = require("safe-stable-stringify");
const stringify = (0, safe_stable_stringify_1.configure)({ bigint: false, circularValue: Error });
/**
 * The cache strategy to use for a given method.
 */
var CacheStrategy;
(function (CacheStrategy) {
    /**
     * Cache per-block.
     */
    CacheStrategy["Block"] = "block";
    /**
     * Cache until a chain reorganization occurs.
     */
    CacheStrategy["Fork"] = "fork";
    /**
     * Never cache.
     */
    CacheStrategy["Never"] = "never";
    /**
     * Permanently cache.
     */
    CacheStrategy["Permanent"] = "perma";
})(CacheStrategy = exports.CacheStrategy || (exports.CacheStrategy = {}));
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
function cacheIdentifierForRequest(request, skipBlockRef) {
    var _a;
    const simpleParams = skipBlockRef
        ? paramsWithoutBlockTag(request)
        : (_a = request.params) !== null && _a !== void 0 ? _a : [];
    if (canCache(request.method)) {
        return `${request.method}:${stringify(simpleParams)}`;
    }
    return null;
}
exports.cacheIdentifierForRequest = cacheIdentifierForRequest;
/**
 * Return whether a method can be cached or not.
 *
 * @param method - The method to check.
 * @returns Whether the method can be cached.
 */
function canCache(method) {
    return cacheTypeForMethod(method) !== CacheStrategy.Never;
}
exports.canCache = canCache;
/**
 * Return the block parameter for the given request, if it has one.
 *
 * @param request - The JSON-RPC request.
 * @returns The block parameter in the given request, or `undefined` if none was found.
 */
function blockTagForRequest(request) {
    if (!request.params) {
        return undefined;
    }
    const index = blockTagParamIndex(request.method);
    // Block tag param not passed.
    if (index === undefined ||
        !Array.isArray(request.params) ||
        index >= request.params.length) {
        return undefined;
    }
    return request.params[index];
}
exports.blockTagForRequest = blockTagForRequest;
/**
 * Return the request parameters without the block parameter.
 *
 * @param request - The JSON-RPC request.
 * @returns The request parameters with the block parameter removed, if one was found.
 */
function paramsWithoutBlockTag(request) {
    if (!request.params) {
        return [];
    }
    const index = blockTagParamIndex(request.method);
    // Block tag param not passed.
    if (index === undefined ||
        !Array.isArray(request.params) ||
        index >= request.params.length) {
        return request.params;
    }
    // eth_getBlockByNumber has the block tag first, then the optional includeTx? param
    if (request.method === 'eth_getBlockByNumber') {
        return request.params.slice(1);
    }
    return request.params.slice(0, index);
}
/**
 * Returns the index of the block parameter for the given method.
 *
 * @param method - A JSON-RPC method.
 * @returns The index of the block parameter for that method, or `undefined` if
 * there is no known block parameter.
 */
function blockTagParamIndex(method) {
    switch (method) {
        // blockTag is at index 2
        case 'eth_getStorageAt':
            return 2;
        // blockTag is at index 1
        case 'eth_getBalance':
        case 'eth_getCode':
        case 'eth_getTransactionCount':
        case 'eth_call':
            return 1;
        // blockTag is at index 0
        case 'eth_getBlockByNumber':
            return 0;
        // there is no blockTag
        default:
            return undefined;
    }
}
exports.blockTagParamIndex = blockTagParamIndex;
/**
 * Return the cache type used for the given method.
 *
 * @param method - A JSON-RPC method.
 * @returns The cache type to use for that method.
 */
function cacheTypeForMethod(method) {
    switch (method) {
        // cache permanently
        case 'web3_clientVersion':
        case 'web3_sha3':
        case 'eth_protocolVersion':
        case 'eth_getBlockTransactionCountByHash':
        case 'eth_getUncleCountByBlockHash':
        case 'eth_getCode':
        case 'eth_getBlockByHash':
        case 'eth_getTransactionByHash':
        case 'eth_getTransactionByBlockHashAndIndex':
        case 'eth_getTransactionReceipt':
        case 'eth_getUncleByBlockHashAndIndex':
        case 'eth_getCompilers':
        case 'eth_compileLLL':
        case 'eth_compileSolidity':
        case 'eth_compileSerpent':
        case 'shh_version':
        case 'test_permaCache':
            return CacheStrategy.Permanent;
        // cache until fork
        case 'eth_getBlockByNumber':
        case 'eth_getBlockTransactionCountByNumber':
        case 'eth_getUncleCountByBlockNumber':
        case 'eth_getTransactionByBlockNumberAndIndex':
        case 'eth_getUncleByBlockNumberAndIndex':
        case 'test_forkCache':
            return CacheStrategy.Fork;
        // cache for block
        case 'eth_gasPrice':
        case 'eth_blockNumber':
        case 'eth_getBalance':
        case 'eth_getStorageAt':
        case 'eth_getTransactionCount':
        case 'eth_call':
        case 'eth_estimateGas':
        case 'eth_getFilterLogs':
        case 'eth_getLogs':
        case 'test_blockCache':
            return CacheStrategy.Block;
        // never cache
        default:
            return CacheStrategy.Never;
    }
}
exports.cacheTypeForMethod = cacheTypeForMethod;
//# sourceMappingURL=cache.js.map