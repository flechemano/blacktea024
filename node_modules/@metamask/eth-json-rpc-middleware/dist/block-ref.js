"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlockRefMiddleware = void 0;
const json_rpc_engine_1 = require("@metamask/json-rpc-engine");
const full_1 = require("klona/full");
const pify_1 = __importDefault(require("pify"));
const logging_utils_1 = require("./logging-utils");
const cache_1 = require("./utils/cache");
const log = (0, logging_utils_1.createModuleLogger)(logging_utils_1.projectLogger, 'block-ref');
function createBlockRefMiddleware({ provider, blockTracker, } = {}) {
    if (!provider) {
        throw Error('BlockRefMiddleware - mandatory "provider" option is missing.');
    }
    if (!blockTracker) {
        throw Error('BlockRefMiddleware - mandatory "blockTracker" option is missing.');
    }
    return (0, json_rpc_engine_1.createAsyncMiddleware)(async (req, res, next) => {
        var _a;
        const blockRefIndex = (0, cache_1.blockTagParamIndex)(req.method);
        // skip if method does not include blockRef
        if (blockRefIndex === undefined) {
            return next();
        }
        const blockRef = Array.isArray(req.params)
            ? (_a = req.params[blockRefIndex]) !== null && _a !== void 0 ? _a : 'latest'
            : 'latest';
        // skip if not "latest"
        if (blockRef !== 'latest') {
            log('blockRef is not "latest", carrying request forward');
            return next();
        }
        // lookup latest block
        const latestBlockNumber = await blockTracker.getLatestBlock();
        log(`blockRef is "latest", setting param ${blockRefIndex} to latest block ${latestBlockNumber}`);
        // create child request with specific block-ref
        const childRequest = (0, full_1.klona)(req);
        if (Array.isArray(childRequest.params)) {
            childRequest.params[blockRefIndex] = latestBlockNumber;
        }
        // perform child request
        log('Performing another request %o', childRequest);
        const childRes = await (0, pify_1.default)(provider.sendAsync).call(provider, childRequest);
        // copy child response onto original response
        res.result = childRes.result;
        res.error = childRes.error;
        return undefined;
    });
}
exports.createBlockRefMiddleware = createBlockRefMiddleware;
//# sourceMappingURL=block-ref.js.map