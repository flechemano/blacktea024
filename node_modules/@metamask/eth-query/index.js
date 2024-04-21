const createRandomId = require('json-rpc-random-id')();
const extend = require('xtend');

module.exports = EthQuery;

/**
 * Wrapping an Ethereum provider object, EthQuery provides some conveniences
 * around making requests to an RPC endpoint:
 *
 * - Each of the RPC methods in the Ethereum spec may be requested not only
 *   via `sendAsync`, but also via its own instance method, whose API is suited
 *   for the RPC method.
 * - When requesting an RPC method, `id` and `jsonrpc` do not need to be
 *   specified and are filled in with reasonable defaults.
 * - The mechanics of `sendAsync` (or any of the RPC-method-specific instance
 *   methods) are simplified such that its callback will be called with an error
 *   argument not only if the callback on the provider's `sendAsync` method was
 *   called with an argument, but also if the `response` object has an `error`
 *   property.
 *
 * @param {any} provider - The provider object.
 */
function EthQuery(provider) {
  const self = this;
  self.currentProvider = provider;
}

//
// base queries
//

// default block
EthQuery.prototype.getBalance = generateFnWithDefaultBlockFor(
  2,
  'eth_getBalance',
);
EthQuery.prototype.getCode = generateFnWithDefaultBlockFor(2, 'eth_getCode');
EthQuery.prototype.getTransactionCount = generateFnWithDefaultBlockFor(
  2,
  'eth_getTransactionCount',
);
EthQuery.prototype.getStorageAt = generateFnWithDefaultBlockFor(
  3,
  'eth_getStorageAt',
);
EthQuery.prototype.call = generateFnWithDefaultBlockFor(2, 'eth_call');
// standard
EthQuery.prototype.protocolVersion = generateFnFor('eth_protocolVersion');
EthQuery.prototype.syncing = generateFnFor('eth_syncing');
EthQuery.prototype.coinbase = generateFnFor('eth_coinbase');
EthQuery.prototype.mining = generateFnFor('eth_mining');
EthQuery.prototype.hashrate = generateFnFor('eth_hashrate');
EthQuery.prototype.gasPrice = generateFnFor('eth_gasPrice');
EthQuery.prototype.accounts = generateFnFor('eth_accounts');
EthQuery.prototype.blockNumber = generateFnFor('eth_blockNumber');
EthQuery.prototype.getBlockTransactionCountByHash = generateFnFor(
  'eth_getBlockTransactionCountByHash',
);
EthQuery.prototype.getBlockTransactionCountByNumber = generateFnFor(
  'eth_getBlockTransactionCountByNumber',
);
EthQuery.prototype.getUncleCountByBlockHash = generateFnFor(
  'eth_getUncleCountByBlockHash',
);
EthQuery.prototype.getUncleCountByBlockNumber = generateFnFor(
  'eth_getUncleCountByBlockNumber',
);
EthQuery.prototype.sign = generateFnFor('eth_sign');
EthQuery.prototype.sendTransaction = generateFnFor('eth_sendTransaction');
EthQuery.prototype.sendRawTransaction = generateFnFor('eth_sendRawTransaction');
EthQuery.prototype.estimateGas = generateFnFor('eth_estimateGas');
EthQuery.prototype.getBlockByHash = generateFnFor('eth_getBlockByHash');
EthQuery.prototype.getBlockByNumber = generateFnFor('eth_getBlockByNumber');
EthQuery.prototype.getTransactionByHash = generateFnFor(
  'eth_getTransactionByHash',
);
EthQuery.prototype.getTransactionByBlockHashAndIndex = generateFnFor(
  'eth_getTransactionByBlockHashAndIndex',
);
EthQuery.prototype.getTransactionByBlockNumberAndIndex = generateFnFor(
  'eth_getTransactionByBlockNumberAndIndex',
);
EthQuery.prototype.getTransactionReceipt = generateFnFor(
  'eth_getTransactionReceipt',
);
EthQuery.prototype.getUncleByBlockHashAndIndex = generateFnFor(
  'eth_getUncleByBlockHashAndIndex',
);
EthQuery.prototype.getUncleByBlockNumberAndIndex = generateFnFor(
  'eth_getUncleByBlockNumberAndIndex',
);
EthQuery.prototype.getCompilers = generateFnFor('eth_getCompilers');
EthQuery.prototype.compileLLL = generateFnFor('eth_compileLLL');
EthQuery.prototype.compileSolidity = generateFnFor('eth_compileSolidity');
EthQuery.prototype.compileSerpent = generateFnFor('eth_compileSerpent');
EthQuery.prototype.newFilter = generateFnFor('eth_newFilter');
EthQuery.prototype.newBlockFilter = generateFnFor('eth_newBlockFilter');
EthQuery.prototype.newPendingTransactionFilter = generateFnFor(
  'eth_newPendingTransactionFilter',
);
EthQuery.prototype.uninstallFilter = generateFnFor('eth_uninstallFilter');
EthQuery.prototype.getFilterChanges = generateFnFor('eth_getFilterChanges');
EthQuery.prototype.getFilterLogs = generateFnFor('eth_getFilterLogs');
EthQuery.prototype.getLogs = generateFnFor('eth_getLogs');
EthQuery.prototype.getWork = generateFnFor('eth_getWork');
EthQuery.prototype.submitWork = generateFnFor('eth_submitWork');
EthQuery.prototype.submitHashrate = generateFnFor('eth_submitHashrate');

// network level

EthQuery.prototype.sendAsync = function (opts, callback) {
  const self = this;
  self.currentProvider.sendAsync(
    createPayload(opts),
    function (error, response) {
      let improvedError = error;
      if (!error && response.error) {
        improvedError = new Error(
          `EthQuery - RPC Error - ${response.error.message}`,
        );
      }
      if (improvedError) {
        return callback(improvedError);
      }
      return callback(null, response.result);
    },
  );
};

// util

/**
 * Generates an instance method designed to call an RPC method that takes no
 * parameters. This instance method uses `sendAsync` internally to make the
 * request to the network.
 *
 * @param {any} methodName - The RPC method.
 * @returns {any} The method.
 */
function generateFnFor(methodName) {
  return function (...args) {
    const self = this;
    const callback = args.pop();
    self.sendAsync(
      {
        method: methodName,
        params: args,
      },
      callback,
    );
  };
}

/**
 * Generates an instance method designed to call an RPC methods that takes one
 * or more parameters. This instance method uses `sendAsync` internally to make
 * the request to the network.
 *
 * @param {any} argCount - The number of parameters that the RPC method is
 * expected to take.
 * @param {any} methodName - The RPC method.
 * @returns {any} The method.
 */
function generateFnWithDefaultBlockFor(argCount, methodName) {
  return function (...args) {
    const self = this;
    const callback = args.pop();
    // set optional default block param
    if (args.length < argCount) {
      args.push('latest');
    }
    self.sendAsync(
      {
        method: methodName,
        params: args,
      },
      callback,
    );
  };
}

/**
 * Builds a complete request payload object from a partial version.
 *
 * @param {any} data - The partial request object.
 * @returns {any} The complete request object.
 */
function createPayload(data) {
  return extend(
    {
      // defaults
      id: createRandomId(),
      jsonrpc: '2.0',
      params: [],
      // user-specified
    },
    data,
  );
}
