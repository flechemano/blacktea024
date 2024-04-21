"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
const eth_json_rpc_provider_1 = require("@metamask/eth-json-rpc-provider");
const json_rpc_engine_1 = require("@metamask/json-rpc-engine");
const create_infura_middleware_1 = require("./create-infura-middleware");
/**
 * Creates a provider (as defined in
 * [`eth-json-rpc-provider`](https://github.com/MetaMask/eth-json-rpc-provider)
 * which is preloaded with middleware specialized for interfacing with Infura
 * JSON-RPC endpoints.
 * @param opts - Options to {@link createInfuraMiddleware}.
 * @returns The provider as returned by `providerFromEngine` (a part of
 * [`eth-json-rpc-provider`](https://github.com/MetaMask/eth-json-rpc-provider)).
 */
function createProvider(opts) {
    const engine = new json_rpc_engine_1.JsonRpcEngine();
    engine.push((0, create_infura_middleware_1.createInfuraMiddleware)(opts));
    return (0, eth_json_rpc_provider_1.providerFromEngine)(engine);
}
exports.createProvider = createProvider;
//# sourceMappingURL=create-provider.js.map