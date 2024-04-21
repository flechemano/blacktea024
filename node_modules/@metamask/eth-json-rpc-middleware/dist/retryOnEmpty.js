"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRetryOnEmptyMiddleware = void 0;
const json_rpc_engine_1 = require("@metamask/json-rpc-engine");
const full_1 = require("klona/full");
const pify_1 = __importDefault(require("pify"));
const logging_utils_1 = require("./logging-utils");
const cache_1 = require("./utils/cache");
const error_1 = require("./utils/error");
const timeout_1 = require("./utils/timeout");
//
// RetryOnEmptyMiddleware will retry any request with an empty response that has
// a numbered block reference at or lower than the blockTracker's latest block.
// Its useful for dealing with load-balanced ethereum JSON RPC
// nodes that are not always in sync with each other.
//
const log = (0, logging_utils_1.createModuleLogger)(logging_utils_1.projectLogger, 'retry-on-empty');
// empty values used to determine if a request should be retried
// `<nil>` comes from https://github.com/ethereum/go-ethereum/issues/16925
const emptyValues = [
    undefined,
    null,
    '\u003cnil\u003e',
];
function createRetryOnEmptyMiddleware({ provider, blockTracker, } = {}) {
    if (!provider) {
        throw Error('RetryOnEmptyMiddleware - mandatory "provider" option is missing.');
    }
    if (!blockTracker) {
        throw Error('RetryOnEmptyMiddleware - mandatory "blockTracker" option is missing.');
    }
    return (0, json_rpc_engine_1.createAsyncMiddleware)(async (req, res, next) => {
        const blockRefIndex = (0, cache_1.blockTagParamIndex)(req.method);
        // skip if method does not include blockRef
        if (blockRefIndex === undefined) {
            return next();
        }
        // skip if not exact block references
        let blockRef = Array.isArray(req.params) && req.params[blockRefIndex]
            ? req.params[blockRefIndex]
            : undefined;
        // omitted blockRef implies "latest"
        if (blockRef === undefined) {
            blockRef = 'latest';
        }
        // skip if non-number block reference
        if (['latest', 'pending'].includes(blockRef)) {
            return next();
        }
        // skip if block refernce is not a valid number
        const blockRefNumber = Number.parseInt(blockRef.slice(2), 16);
        if (Number.isNaN(blockRefNumber)) {
            return next();
        }
        // lookup latest block
        const latestBlockNumberHex = await blockTracker.getLatestBlock();
        const latestBlockNumber = Number.parseInt(latestBlockNumberHex.slice(2), 16);
        // skip if request block number is higher than current
        if (blockRefNumber > latestBlockNumber) {
            log('Requested block number %o is higher than latest block number %o, falling through to original request', blockRefNumber, latestBlockNumber);
            return next();
        }
        log('Requested block number %o is not higher than latest block number %o, trying request until non-empty response is received', blockRefNumber, latestBlockNumber);
        // create child request with specific block-ref
        const childRequest = (0, full_1.klona)(req);
        // attempt child request until non-empty response is received
        const childResponse = await retry(10, async () => {
            log('Performing request %o', childRequest);
            const attemptResponse = await (0, pify_1.default)(provider.sendAsync).call(provider, childRequest);
            log('Response is %o', attemptResponse);
            // verify result
            if (emptyValues.includes(attemptResponse.result)) {
                throw new Error(`RetryOnEmptyMiddleware - empty response "${JSON.stringify(attemptResponse)}" for request "${JSON.stringify(childRequest)}"`);
            }
            return attemptResponse;
        });
        log('Copying result %o and error %o', childResponse.result, childResponse.error);
        // copy child response onto original response
        res.result = childResponse.result;
        res.error = childResponse.error;
        return undefined;
    });
}
exports.createRetryOnEmptyMiddleware = createRetryOnEmptyMiddleware;
async function retry(maxRetries, asyncFn) {
    for (let index = 0; index < maxRetries; index++) {
        try {
            return await asyncFn();
        }
        catch (err) {
            if ((0, error_1.isExecutionRevertedError)(err)) {
                throw err;
            }
            log('(call %i) Request failed, waiting 1s to retry again...', index + 1);
            await (0, timeout_1.timeout)(1000);
        }
    }
    log('Retries exhausted');
    throw new Error('RetryOnEmptyMiddleware - retries exhausted');
}
//# sourceMappingURL=retryOnEmpty.js.map