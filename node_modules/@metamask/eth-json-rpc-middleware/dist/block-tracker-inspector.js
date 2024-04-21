"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlockTrackerInspectorMiddleware = void 0;
const json_rpc_engine_1 = require("@metamask/json-rpc-engine");
const logging_utils_1 = require("./logging-utils");
const log = (0, logging_utils_1.createModuleLogger)(logging_utils_1.projectLogger, 'block-tracker-inspector');
const futureBlockRefRequests = [
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
];
/**
 * Determines whether the given object has the given property.
 *
 * @param objectToCheck - The object to check.
 * @param property - The property to look for.
 * @returns Whether the object has the property.
 */
function hasProperty(objectToCheck, property) {
    return Object.hasOwnProperty.call(objectToCheck, property);
}
function getResultBlockNumber(response) {
    const { result } = response;
    if (!result ||
        typeof result !== 'object' ||
        !hasProperty(result, 'blockNumber')) {
        return undefined;
    }
    if (typeof result.blockNumber === 'string') {
        return result.blockNumber;
    }
    return undefined;
}
// inspect if response contains a block ref higher than our latest block
function createBlockTrackerInspectorMiddleware({ blockTracker, }) {
    return (0, json_rpc_engine_1.createAsyncMiddleware)(async (req, res, next) => {
        if (!futureBlockRefRequests.includes(req.method)) {
            return next();
        }
        // eslint-disable-next-line n/callback-return
        await next();
        // abort if no result or no block number
        const responseBlockNumber = getResultBlockNumber(res);
        if (!responseBlockNumber) {
            return undefined;
        }
        log('res.result.blockNumber exists, proceeding. res = %o', res);
        // if number is higher, suggest block-tracker check for a new block
        const blockNumber = Number.parseInt(responseBlockNumber, 16);
        // Typecast: If getCurrentBlock returns null, currentBlockNumber will be NaN, which is fine.
        const currentBlockNumber = Number.parseInt(blockTracker.getCurrentBlock(), 16);
        if (blockNumber > currentBlockNumber) {
            log('blockNumber from response is greater than current block number, refreshing current block number');
            await blockTracker.checkForLatestBlock();
        }
        return undefined;
    });
}
exports.createBlockTrackerInspectorMiddleware = createBlockTrackerInspectorMiddleware;
//# sourceMappingURL=block-tracker-inspector.js.map