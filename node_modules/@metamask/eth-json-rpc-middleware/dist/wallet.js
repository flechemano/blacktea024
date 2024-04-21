"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletMiddleware = void 0;
const sigUtil = __importStar(require("@metamask/eth-sig-util"));
const json_rpc_engine_1 = require("@metamask/json-rpc-engine");
const rpc_errors_1 = require("@metamask/rpc-errors");
function createWalletMiddleware({ getAccounts, processDecryptMessage, processEncryptionPublicKey, processEthSignMessage, processPersonalMessage, processTransaction, processSignTransaction, processTypedMessage, processTypedMessageV3, processTypedMessageV4, }) {
    if (!getAccounts) {
        throw new Error('opts.getAccounts is required');
    }
    return (0, json_rpc_engine_1.createScaffoldMiddleware)({
        // account lookups
        eth_accounts: (0, json_rpc_engine_1.createAsyncMiddleware)(lookupAccounts),
        eth_coinbase: (0, json_rpc_engine_1.createAsyncMiddleware)(lookupDefaultAccount),
        // tx signatures
        eth_sendTransaction: (0, json_rpc_engine_1.createAsyncMiddleware)(sendTransaction),
        eth_signTransaction: (0, json_rpc_engine_1.createAsyncMiddleware)(signTransaction),
        // message signatures
        eth_sign: (0, json_rpc_engine_1.createAsyncMiddleware)(ethSign),
        eth_signTypedData: (0, json_rpc_engine_1.createAsyncMiddleware)(signTypedData),
        eth_signTypedData_v3: (0, json_rpc_engine_1.createAsyncMiddleware)(signTypedDataV3),
        eth_signTypedData_v4: (0, json_rpc_engine_1.createAsyncMiddleware)(signTypedDataV4),
        personal_sign: (0, json_rpc_engine_1.createAsyncMiddleware)(personalSign),
        eth_getEncryptionPublicKey: (0, json_rpc_engine_1.createAsyncMiddleware)(encryptionPublicKey),
        eth_decrypt: (0, json_rpc_engine_1.createAsyncMiddleware)(decryptMessage),
        personal_ecRecover: (0, json_rpc_engine_1.createAsyncMiddleware)(personalRecover),
    });
    //
    // account lookups
    //
    async function lookupAccounts(req, res) {
        res.result = await getAccounts(req);
    }
    async function lookupDefaultAccount(req, res) {
        const accounts = await getAccounts(req);
        res.result = accounts[0] || null;
    }
    //
    // transaction signatures
    //
    async function sendTransaction(req, res) {
        if (!processTransaction) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!req.params ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 1)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params[0];
        const txParams = Object.assign(Object.assign({}, params), { from: await validateAndNormalizeKeyholder((params === null || params === void 0 ? void 0 : params.from) || '', req) });
        res.result = await processTransaction(txParams, req);
    }
    async function signTransaction(req, res) {
        if (!processSignTransaction) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!req.params ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 1)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params[0];
        const txParams = Object.assign(Object.assign({}, params), { from: await validateAndNormalizeKeyholder((params === null || params === void 0 ? void 0 : params.from) || '', req) });
        res.result = await processSignTransaction(txParams, req);
    }
    //
    // message signatures
    //
    async function ethSign(req, res) {
        if (!processEthSignMessage) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 2)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        const address = await validateAndNormalizeKeyholder(params[0], req);
        const message = params[1];
        const extraParams = params[2] || {};
        const msgParams = Object.assign(Object.assign({}, extraParams), { from: address, data: message, signatureMethod: 'eth_sign' });
        res.result = await processEthSignMessage(msgParams, req);
    }
    async function signTypedData(req, res) {
        if (!processTypedMessage) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 2)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        const message = params[0];
        const address = await validateAndNormalizeKeyholder(params[1], req);
        const version = 'V1';
        const extraParams = params[2] || {};
        const msgParams = Object.assign(Object.assign({}, extraParams), { from: address, data: message, signatureMethod: 'eth_signTypedData', version });
        res.result = await processTypedMessage(msgParams, req, version);
    }
    async function signTypedDataV3(req, res) {
        if (!processTypedMessageV3) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 2)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        const address = await validateAndNormalizeKeyholder(params[0], req);
        const message = params[1];
        const version = 'V3';
        const msgParams = {
            data: message,
            from: address,
            version,
            signatureMethod: 'eth_signTypedData_v3',
        };
        res.result = await processTypedMessageV3(msgParams, req, version);
    }
    async function signTypedDataV4(req, res) {
        if (!processTypedMessageV4) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 2)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        const address = await validateAndNormalizeKeyholder(params[0], req);
        const message = params[1];
        const version = 'V4';
        const msgParams = {
            data: message,
            from: address,
            version,
            signatureMethod: 'eth_signTypedData_v4',
        };
        res.result = await processTypedMessageV4(msgParams, req, version);
    }
    async function personalSign(req, res) {
        if (!processPersonalMessage) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 2)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        // process normally
        const firstParam = params[0];
        const secondParam = params[1];
        // non-standard "extraParams" to be appended to our "msgParams" obj
        const extraParams = params[2] || {};
        // We initially incorrectly ordered these parameters.
        // To gracefully respect users who adopted this API early,
        // we are currently gracefully recovering from the wrong param order
        // when it is clearly identifiable.
        //
        // That means when the first param is definitely an address,
        // and the second param is definitely not, but is hex.
        let address, message;
        if (resemblesAddress(firstParam) && !resemblesAddress(secondParam)) {
            let warning = `The eth_personalSign method requires params ordered `;
            warning += `[message, address]. This was previously handled incorrectly, `;
            warning += `and has been corrected automatically. `;
            warning += `Please switch this param order for smooth behavior in the future.`;
            res.warning = warning;
            address = firstParam;
            message = secondParam;
        }
        else {
            message = firstParam;
            address = secondParam;
        }
        address = await validateAndNormalizeKeyholder(address, req);
        const msgParams = Object.assign(Object.assign({}, extraParams), { from: address, data: message, signatureMethod: 'personal_sign' });
        // eslint-disable-next-line require-atomic-updates
        res.result = await processPersonalMessage(msgParams, req);
    }
    async function personalRecover(req, res) {
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 2)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        const message = params[0];
        const signature = params[1];
        const signerAddress = sigUtil.recoverPersonalSignature({
            data: message,
            signature,
        });
        res.result = signerAddress;
    }
    async function encryptionPublicKey(req, res) {
        if (!processEncryptionPublicKey) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 1)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        const address = await validateAndNormalizeKeyholder(params[0], req);
        res.result = await processEncryptionPublicKey(address, req);
    }
    async function decryptMessage(req, res) {
        if (!processDecryptMessage) {
            throw rpc_errors_1.rpcErrors.methodNotSupported();
        }
        if (!(req === null || req === void 0 ? void 0 : req.params) ||
            !Array.isArray(req.params) ||
            !(req.params.length >= 1)) {
            throw rpc_errors_1.rpcErrors.invalidInput();
        }
        const params = req.params;
        const ciphertext = params[0];
        const address = await validateAndNormalizeKeyholder(params[1], req);
        const extraParams = params[2] || {};
        const msgParams = Object.assign(Object.assign({}, extraParams), { from: address, data: ciphertext });
        res.result = await processDecryptMessage(msgParams, req);
    }
    //
    // utility
    //
    /**
     * Validates the keyholder address, and returns a normalized (i.e. lowercase)
     * copy of it.
     *
     * @param address - The address to validate and normalize.
     * @param req - The request object.
     * @returns {string} - The normalized address, if valid. Otherwise, throws
     * an error
     */
    async function validateAndNormalizeKeyholder(address, req) {
        if (typeof address === 'string' &&
            address.length > 0 &&
            resemblesAddress(address)) {
            // Ensure that an "unauthorized" error is thrown if the requester does not have the `eth_accounts`
            // permission.
            const accounts = await getAccounts(req);
            const normalizedAccounts = accounts.map((_address) => _address.toLowerCase());
            const normalizedAddress = address.toLowerCase();
            if (normalizedAccounts.includes(normalizedAddress)) {
                return normalizedAddress;
            }
            throw rpc_errors_1.providerErrors.unauthorized();
        }
        throw rpc_errors_1.rpcErrors.invalidParams({
            message: `Invalid parameters: must provide an Ethereum address.`,
        });
    }
}
exports.createWalletMiddleware = createWalletMiddleware;
function resemblesAddress(str) {
    // hex prefix 2 + 20 bytes
    return str.length === 2 + 20 * 2;
}
//# sourceMappingURL=wallet.js.map