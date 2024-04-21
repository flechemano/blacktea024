"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExecutionRevertedError = void 0;
const rpc_errors_1 = require("@metamask/rpc-errors");
const utils_1 = require("@metamask/utils");
function isExecutionRevertedError(error) {
    return ((0, utils_1.isJsonRpcError)(error) &&
        error.code === rpc_errors_1.errorCodes.rpc.invalidInput &&
        error.message === 'execution reverted');
}
exports.isExecutionRevertedError = isExecutionRevertedError;
//# sourceMappingURL=error.js.map