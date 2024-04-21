"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlockRefRewriteMiddleware = void 0;
const json_rpc_engine_1 = require("@metamask/json-rpc-engine");
const cache_1 = require("./utils/cache");
function createBlockRefRewriteMiddleware({ blockTracker, } = {}) {
    if (!blockTracker) {
        throw Error('BlockRefRewriteMiddleware - mandatory "blockTracker" option is missing.');
    }
    return (0, json_rpc_engine_1.createAsyncMiddleware)(async (req, _res, next) => {
        const blockRefIndex = (0, cache_1.blockTagParamIndex)(req.method);
        // skip if method does not include blockRef
        if (blockRefIndex === undefined) {
            return next();
        }
        // skip if not "latest"
        const blockRef = Array.isArray(req.params) && req.params[blockRefIndex]
            ? req.params[blockRefIndex]
            : // omitted blockRef implies "latest"
                'latest';
        if (blockRef !== 'latest') {
            return next();
        }
        // rewrite blockRef to block-tracker's block number
        const latestBlockNumber = await blockTracker.getLatestBlock();
        if (Array.isArray(req.params)) {
            // eslint-disable-next-line require-atomic-updates
            req.params[blockRefIndex] = latestBlockNumber;
        }
        return next();
    });
}
exports.createBlockRefRewriteMiddleware = createBlockRefRewriteMiddleware;
//# sourceMappingURL=block-ref-rewrite.js.map